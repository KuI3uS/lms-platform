import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import { useAuth } from "../context/AuthContext";
import { fetchLearningStats, invalidateLearningStats } from "../api/learningStats";
import LeagueBadge from "./LeagueBadge";
import {
    BsBell,
    BsBoxArrowRight,
    BsChevronDown,
    BsFire,
    BsGem,
    BsList,
    BsPerson,
    BsX
} from "react-icons/bs";

const PAGE_TITLES = [
    ["/dashboard", "Start"],
    ["/courses", "Kursy"],
    ["/results", "Wyniki zadań"],
    ["/exams", "Egzaminy INF"],
    ["/learning-center", "Postęp"],
    ["/language-reviews", "Powtórki językowe"],
    ["/access-code", "Kod dostępu"],
    ["/modules", "Twój kurs"],
    ["/lessons", "Lekcje"],
    ["/checkout", "Dostęp do kursu"],
    ["/admin/course-orders", "Zamówienia"],
    ["/admin/courses", "Kursy"],
    ["/admin/add-course", "Nowy kurs"],
    ["/admin/users", "Użytkownicy"],
    ["/admin/submissions", "Prace uczniów"],
    ["/admin/tutoring", "Korepetycje"],
    ["/admin/access-codes", "Kody dostępu"],
    ["/admin", "Panel twórcy"]
];

function formatExpiry(value) {
    if (!value) return "Wykonaj zadanie, aby rozpocząć serię";
    return `Wygasa ${new Intl.DateTimeFormat("pl-PL", {
        timeZone: "Europe/Warsaw",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date(value))}`;
}

export default function Navbar({ onMenuClick }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const identity = {
        email: user?.email || "Użytkownik",
        role: user?.role || "STUDENT"
    };
    const [learningStats, setLearningStats] = useState({ xp: 0, level: 1, taskStreak: 0, xpMultiplier: 1, gemBalance: 0 });
    const [notifications, setNotifications] = useState({ unreadCount: 0, notifications: [] });
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const notificationTriggerRef = useRef(null);
    const notificationPanelRef = useRef(null);
    const profileTriggerRef = useRef(null);
    const profilePanelRef = useRef(null);

    const pageTitle = PAGE_TITLES.find(([path]) => location.pathname.startsWith(path))?.[1] || "EduHub";
    const streakActive = learningStats.taskStreak > 0
        && Boolean(learningStats.taskStreakExpiresAt);
    const visibleStreak = streakActive ? learningStats.taskStreak : 0;
    const visibleMultiplier = streakActive ? learningStats.xpMultiplier : 1;
    const initials = identity.email.slice(0, 2).toUpperCase();
    const displayName = user?.firstName || identity.email.split("@")[0];

    useEffect(() => {
        if (!notificationsOpen && !profileOpen) return undefined;
        const panel = notificationsOpen ? notificationPanelRef.current : profilePanelRef.current;
        const trigger = notificationsOpen ? notificationTriggerRef.current : profileTriggerRef.current;
        const close = () => {
            setNotificationsOpen(false);
            setProfileOpen(false);
        };
        panel?.focus();
        const dismissOnEscape = event => {
            if (event.key !== "Escape") return;
            event.preventDefault();
            close();
            trigger?.focus();
        };
        const dismissOutside = event => {
            if (!panel?.contains(event.target) && !trigger?.contains(event.target)) close();
        };
        document.addEventListener("keydown", dismissOnEscape);
        document.addEventListener("pointerdown", dismissOutside);
        document.addEventListener("focusin", dismissOutside);
        return () => {
            document.removeEventListener("keydown", dismissOnEscape);
            document.removeEventListener("pointerdown", dismissOutside);
            document.removeEventListener("focusin", dismissOutside);
        };
    }, [notificationsOpen, profileOpen]);

    const closeNotifications = () => {
        setNotificationsOpen(false);
        notificationTriggerRef.current?.focus();
    };

    useEffect(() => {
        let active = true;
        const refresh = ({ force = false } = {}) => {
            fetchLearningStats({ force })
                .then((data) => active && data && setLearningStats(data))
                .catch(() => {});
            apiFetch("/notifications")
                .then((data) => active && data && setNotifications(data))
                .catch(() => {});
        };
        const refreshVisible = () => document.visibilityState === "visible" && refresh();
        const refreshStats = () => {
            invalidateLearningStats();
            refresh({ force: true });
        };
        refresh();
        const refreshTimer = window.setInterval(refresh, 30000);
        document.addEventListener("visibilitychange", refreshVisible);
        window.addEventListener("eduhub:stats-changed", refreshStats);
        return () => {
            active = false;
            window.clearInterval(refreshTimer);
            document.removeEventListener("visibilitychange", refreshVisible);
            window.removeEventListener("eduhub:stats-changed", refreshStats);
        };
    }, []);

    const openNotification = async (notification) => {
        if (!notification.read) {
            try {
                await apiFetch(`/notifications/${notification.id}/read`, { method: "PUT" });
                setNotifications((current) => ({
                    unreadCount: Math.max(0, current.unreadCount - 1),
                    notifications: current.notifications.map((item) =>
                        item.id === notification.id ? { ...item, read: true } : item
                    )
                }));
            } catch {
                // Nawigacja nadal może zostać wykonana.
            }
        }
        setNotificationsOpen(false);
        if (notification.link) navigate(notification.link);
    };

    const markAllRead = async () => {
        try {
            await apiFetch("/notifications/read-all", { method: "PUT" });
            setNotifications((current) => ({
                unreadCount: 0,
                notifications: current.notifications.map((item) => ({ ...item, read: true }))
            }));
        } catch {
            // Nie zmieniamy lokalnego stanu po błędzie serwera.
        }
    };

    const notificationsLayer = notificationsOpen && typeof document !== "undefined"
        ? createPortal(
            <>
                <button
                    type="button"
                    aria-label="Zamknij powiadomienia"
                    tabIndex={-1}
                    onClick={closeNotifications}
                    className="fixed inset-0 z-[9998] cursor-default bg-slate-900/15"
                />
                <section ref={notificationPanelRef} id="workspace-notifications" tabIndex={-1} aria-label="Powiadomienia" className="fixed right-3 top-[4.5rem] z-[9999] w-[min(25rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-xl shadow-slate-900/10 outline-none sm:right-5">
                    <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4">
                        <div>
                            <p className="font-bold">Powiadomienia</p>
                            <p className="text-xs text-slate-500">{notifications.unreadCount} nowych</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {notifications.unreadCount > 0 && (
                                <button type="button" onClick={markAllRead} className="rounded-lg p-2 text-xs font-semibold text-teal-700 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
                                    Przeczytaj wszystkie
                                </button>
                            )}
                            <button type="button" aria-label="Zamknij powiadomienia" onClick={closeNotifications} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
                                <BsX />
                            </button>
                        </div>
                    </div>
                    <div className="max-h-[min(28rem,calc(100dvh-10rem))] overflow-y-auto p-2">
                        {notifications.notifications.length === 0 ? (
                            <p className="p-8 text-center text-sm text-slate-500">Wszystko przeczytane. Możesz wracać do nauki.</p>
                        ) : notifications.notifications.slice(0, 10).map((notification) => (
                            <button
                                key={notification.id}
                                type="button"
                                onClick={() => openNotification(notification)}
                                className={`block w-full rounded-xl p-3 text-left transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${notification.read ? "text-slate-600" : "bg-teal-50/70 text-slate-900"}`}
                            >
                                <span className="block text-sm font-semibold">{notification.title}</span>
                                <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-600">{notification.message}</span>
                            </button>
                        ))}
                    </div>
                </section>
            </>,
            document.body
        )
        : null;

    return (
        <>
            <header className="workspace-navbar relative z-40 flex h-[4.5rem] shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 text-slate-900 sm:px-6 lg:px-8">
                <div className="flex min-w-0 items-center gap-3">
                    <button type="button" aria-label="Otwórz menu" onClick={onMenuClick} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 lg:hidden">
                        <BsList size={22} />
                    </button>
                    <div className="min-w-0">
                        <p className="text-[11px] font-medium text-slate-500">Twoja przestrzeń</p>
                        <h2 className="truncate text-base font-bold sm:text-lg">{pageTitle}</h2>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <button
                        ref={notificationTriggerRef}
                        type="button"
                        aria-label={`Powiadomienia: ${notifications.unreadCount} nowych`}
                        aria-expanded={notificationsOpen}
                        aria-controls={notificationsOpen ? "workspace-notifications" : undefined}
                        onClick={() => { setNotificationsOpen((open) => !open); setProfileOpen(false); }}
                        className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                    >
                        <BsBell />
                        {notifications.unreadCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-teal-700 px-1 text-[10px] font-bold text-white">{Math.min(99, notifications.unreadCount)}</span>}
                    </button>
                    <div className="relative">
                        <button
                            ref={profileTriggerRef}
                            type="button"
                            aria-label="Otwórz profil"
                            aria-expanded={profileOpen}
                            aria-controls={profileOpen ? "workspace-profile" : undefined}
                            onClick={() => { setProfileOpen((open) => !open); setNotificationsOpen(false); }}
                            className="flex h-10 items-center gap-2 rounded-xl py-1 pl-1 pr-2 text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 sm:gap-3"
                        >
                            <span className="grid h-9 w-9 place-items-center rounded-full bg-teal-50 text-xs font-bold text-teal-800">{initials}</span>
                            <span className="hidden max-w-36 truncate text-sm font-semibold sm:block">{displayName}</span>
                            <BsChevronDown className="hidden text-xs sm:block" />
                        </button>
                        {profileOpen && (
                            <section ref={profilePanelRef} id="workspace-profile" tabIndex={-1} aria-label="Twój profil i postęp" className="absolute right-0 top-12 max-h-[calc(100dvh-6rem)] w-[min(20rem,calc(100vw-1.5rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 text-slate-900 shadow-xl shadow-slate-900/10 outline-none">
                                <div className="border-b border-slate-100 px-3 py-3">
                                    <p className="truncate text-sm font-bold">{identity.email}</p>
                                    <p className="mt-1 text-xs text-slate-500">{identity.role === "ADMIN" ? "Administrator" : "Konto ucznia"}</p>
                                </div>
                                <div className="mx-2 my-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                                    <div className="flex items-center gap-3">
                                        <LeagueBadge name={learningStats.leagueName || "Miedź"} size="xs" muted />
                                        <div>
                                            <p className="text-sm font-semibold">Liga {learningStats.leagueName || "Miedź"}</p>
                                            <p className="mt-0.5 text-xs text-slate-500">Poziom {learningStats.level || 1} · {Number(learningStats.xp || 0).toLocaleString("pl-PL")} XP</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200/70 pt-3 text-xs">
                                        <span title={formatExpiry(streakActive ? learningStats.taskStreakExpiresAt : null)} className="inline-flex items-center gap-1.5 text-slate-600"><BsFire className="text-orange-600" /> Seria {visibleStreak} · ×{visibleMultiplier}</span>
                                        <span aria-label={`${Number(learningStats.gemBalance || 0).toLocaleString("pl-PL")} klejnotów`} className="inline-flex items-center gap-1.5 font-semibold text-teal-800"><BsGem /> {Number(learningStats.gemBalance || 0).toLocaleString("pl-PL")}</span>
                                    </div>
                                </div>
                                <button type="button" onClick={() => { setProfileOpen(false); navigate("/learning-center"); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
                                    <BsPerson /> Postęp i nagrody
                                </button>
                                <button type="button" onClick={async () => { await logout(); window.location.href = "/login"; }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600">
                                    <BsBoxArrowRight /> Wyloguj
                                </button>
                            </section>
                        )}
                    </div>
                </div>
            </header>
            {notificationsLayer}
        </>
    );
}

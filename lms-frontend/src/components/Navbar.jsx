import { useEffect, useState } from "react";
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
    ["/dashboard", "Twój dzień"],
    ["/courses", "Ścieżki nauki"],
    ["/results", "Wyniki"],
    ["/exams", "Egzaminy INF"],
    ["/learning-center", "Postęp i nagrody"],
    ["/admin/course-orders", "Zamówienia"],
    ["/admin/users", "Użytkownicy"],
    ["/admin/submissions", "Prace uczniów"],
    ["/admin/tutoring", "Korepetycje"],
    ["/admin", "Strefa twórcy"]
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

    const pageTitle = PAGE_TITLES.find(([path]) => location.pathname.startsWith(path))?.[1] || "EduHub";
    const streakActive = learningStats.taskStreak > 0
        && Boolean(learningStats.taskStreakExpiresAt);
    const visibleStreak = streakActive ? learningStats.taskStreak : 0;
    const visibleMultiplier = streakActive ? learningStats.xpMultiplier : 1;
    const initials = identity.email.slice(0, 2).toUpperCase();

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
                    onClick={() => setNotificationsOpen(false)}
                    className="fixed inset-0 z-[9998] cursor-default bg-black/35 backdrop-blur-[2px]"
                />
                <section className="fixed right-3 top-[4.5rem] z-[9999] w-[min(23rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f19] shadow-2xl shadow-black/70 sm:right-5">
                    <div className="flex items-center justify-between border-b border-white/[0.08] p-4">
                        <div>
                            <p className="font-black">Powiadomienia</p>
                            <p className="text-xs text-slate-500">{notifications.unreadCount} nowych</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {notifications.unreadCount > 0 && (
                                <button type="button" onClick={markAllRead} className="text-xs font-bold text-cyan-300">
                                    Przeczytaj wszystkie
                                </button>
                            )}
                            <button type="button" aria-label="Zamknij" onClick={() => setNotificationsOpen(false)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-white/10">
                                <BsX />
                            </button>
                        </div>
                    </div>
                    <div className="max-h-[28rem] overflow-y-auto p-2">
                        {notifications.notifications.length === 0 ? (
                            <p className="p-8 text-center text-sm text-slate-500">Wszystko przeczytane. Możesz wracać do nauki.</p>
                        ) : notifications.notifications.slice(0, 10).map((notification) => (
                            <button
                                key={notification.id}
                                type="button"
                                onClick={() => openNotification(notification)}
                                className={`block w-full rounded-xl p-3 text-left transition hover:bg-white/[0.06] ${notification.read ? "opacity-60" : "bg-cyan-400/[0.04]"}`}
                            >
                                <span className="block text-sm font-black">{notification.title}</span>
                                <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500">{notification.message}</span>
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
            <header className="relative z-40 flex h-16 shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#070a12]/90 px-3 backdrop-blur-2xl sm:px-5 lg:px-7">
                <div className="flex min-w-0 items-center gap-3">
                    <button type="button" aria-label="Otwórz menu" onClick={onMenuClick} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 lg:hidden">
                        <BsList size={22} />
                    </button>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-600">Przestrzeń nauki</p>
                        <h2 className="truncate text-base font-black sm:text-lg">{pageTitle}</h2>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div
                        title={formatExpiry(streakActive ? learningStats.taskStreakExpiresAt : null)}
                        className={`hidden items-center gap-2 rounded-xl border px-3 py-2 sm:flex ${streakActive ? "border-orange-400/20 bg-orange-400/10 text-orange-200" : "border-white/[0.08] bg-white/[0.03] text-slate-500"}`}
                    >
                        <BsFire />
                        <span className="text-xs font-black">Seria {visibleStreak}</span>
                        <span className="rounded-md bg-black/20 px-1.5 py-0.5 text-[10px] font-black">×{visibleMultiplier}</span>
                    </div>
                    <div className="hidden items-center gap-2 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.08] px-3 py-2 text-xs font-black text-cyan-100 md:flex">
                        <BsGem className="text-cyan-300" /> {Number(learningStats.gemBalance || 0).toLocaleString("pl-PL")}
                    </div>
                    <div
                        title={`Liga ${learningStats.leagueName || "Miedź"} · poziom ${learningStats.level || 1}`}
                        className="hidden items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] py-1 pl-1 pr-3 lg:flex"
                    >
                        <LeagueBadge name={learningStats.leagueName || "Miedź"} size="xs" />
                        <span className="text-left leading-tight">
                            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Liga</span>
                            <span className="block text-xs font-black text-white">{learningStats.leagueName || "Miedź"}</span>
                        </span>
                    </div>
                    <button
                        type="button"
                        aria-label={`Powiadomienia: ${notifications.unreadCount} nowych`}
                        onClick={() => { setNotificationsOpen((open) => !open); setProfileOpen(false); }}
                        className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-slate-300 transition hover:border-cyan-400/30 hover:text-white"
                    >
                        <BsBell />
                        {notifications.unreadCount > 0 && <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-cyan-400 px-1 text-[10px] font-black text-slate-950">{Math.min(99, notifications.unreadCount)}</span>}
                    </button>
                    <div className="relative">
                        <button
                            type="button"
                            aria-label="Otwórz profil"
                            onClick={() => { setProfileOpen((open) => !open); setNotificationsOpen(false); }}
                            className="flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] pl-1.5 pr-2 text-slate-300 transition hover:border-cyan-400/30"
                        >
                            <span className="grid h-7 w-7 place-items-center rounded-lg border bg-slate-900 text-[10px] font-black" style={{ borderColor: learningStats.leagueColor || "#22d3ee", color: learningStats.leagueColor || "#22d3ee", boxShadow: Number(learningStats.level || 1) >= 5 ? `0 0 12px ${learningStats.leagueColor || "#22d3ee"}55` : "none" }}>{initials}</span>
                            <BsChevronDown className="hidden text-xs sm:block" />
                        </button>
                        {profileOpen && (
                            <div className="absolute right-0 top-12 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f19] p-2 shadow-2xl shadow-black/60">
                                <div className="border-b border-white/[0.08] px-3 py-3">
                                    <p className="truncate text-sm font-black">{identity.email}</p>
                                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300">{identity.role}</p>
                                </div>
                                <button type="button" onClick={() => navigate("/learning-center")} className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-slate-300 hover:bg-white/[0.06]">
                                    <BsPerson /> Mój postęp
                                </button>
                                <button type="button" onClick={async () => { await logout(); window.location.href = "/login"; }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-red-300 hover:bg-red-500/10">
                                    <BsBoxArrowRight /> Wyloguj
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            {notificationsLayer}
        </>
    );
}

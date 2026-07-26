import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, logout } from "../api/api";
import {
    BsBell,
    BsBoxArrowRight,
    BsFire,
    BsList,
    BsPersonCircle,
    BsRocketTakeoff
} from "react-icons/bs";

export default function Navbar({ onMenuClick }) {
    const navigate = useNavigate();
    const [learningStats, setLearningStats] = useState({ xp: 0, streakDays: 0 });
    const [notifications, setNotifications] = useState({
        unreadCount: 0,
        notifications: []
    });
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const token = localStorage.getItem("token");

    let email = "";
    let role = "";

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            email = payload.sub || payload.email || "";
            role = payload.role || "";
        } catch (error) {
            console.error("Błędny token", error);
        }
    }

    useEffect(() => {
        let active = true;

        const refresh = () => {
            apiFetch("/learning-stats")
                .then(data => {
                    if (active && data) setLearningStats(data);
                })
                .catch(error => console.error("Nie udało się pobrać statystyk nauki", error));

            apiFetch("/notifications")
                .then(data => {
                    if (active && data) setNotifications(data);
                })
                .catch(() => {});
        };

        const refreshWhenVisible = () => {
            if (document.visibilityState === "visible") refresh();
        };

        refresh();
        const timer = window.setInterval(refresh, 30000);
        document.addEventListener("visibilitychange", refreshWhenVisible);

        return () => {
            active = false;
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", refreshWhenVisible);
        };
    }, []);

    const streakLabel = learningStats.streakDays === 1 ? "dzień" : "dni";

    const openNotification = async (notification) => {
        if (!notification.read) {
            try {
                await apiFetch(`/notifications/${notification.id}/read`, {
                    method: "PUT"
                });
                setNotifications((current) => ({
                    unreadCount: Math.max(0, current.unreadCount - 1),
                    notifications: current.notifications.map((item) =>
                        item.id === notification.id ? { ...item, read: true } : item
                    )
                }));
            } catch {
                // Przejście do celu nadal jest możliwe.
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
            // Stan pozostaje bez zmian, jeśli serwer odrzuci operację.
        }
    };

    return (
        <header className="relative flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-slate-950/90 px-3 backdrop-blur-xl sm:h-20 sm:px-5 lg:px-8">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                <button
                    type="button"
                    aria-label="Otwórz menu"
                    onClick={onMenuClick}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:border-cyan-500/50 hover:bg-cyan-500/10 lg:hidden"
                >
                    <BsList size={24} />
                </button>

                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20 sm:h-11 sm:w-11 sm:rounded-2xl">
                        <BsRocketTakeoff className="text-white" size={21} />
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="text-lg font-black text-white sm:text-xl">EduHub</h1>
                        <p className="hidden text-xs text-slate-400 md:block">Platforma nauki programowania</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                <div className="hidden items-center gap-2 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-2 text-orange-300 2xl:flex">
                    <BsFire />
                    <span className="text-sm font-bold">
                        Seria: {learningStats.streakDays} {streakLabel}
                    </span>
                </div>
                <div className="hidden items-center gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-blue-300 md:flex">
                    <span className="text-sm font-bold">{learningStats.xp} XP</span>
                </div>
                <div className="relative block">
                    <button
                        type="button"
                        aria-label={`Powiadomienia: ${notifications.unreadCount} nieprzeczytanych`}
                        onClick={() => setNotificationsOpen((open) => !open)}
                        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 transition hover:border-blue-500 sm:h-11 sm:w-11 sm:rounded-2xl"
                    >
                        <BsBell className="text-slate-300" />
                        {notifications.unreadCount > 0 && (
                            <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                                {Math.min(99, notifications.unreadCount)}
                            </span>
                        )}
                    </button>

                    {notificationsOpen && (
                        <div className="absolute right-0 top-14 z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/60">
                            <div className="flex items-center justify-between border-b border-white/10 p-4">
                                <div>
                                    <p className="font-black">Powiadomienia</p>
                                    <p className="text-xs text-slate-500">{notifications.unreadCount} nieprzeczytanych</p>
                                </div>
                                {notifications.unreadCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={markAllRead}
                                        className="text-xs font-bold text-cyan-300"
                                    >
                                        Oznacz wszystkie
                                    </button>
                                )}
                            </div>
                            <div className="max-h-96 overflow-y-auto p-2">
                                {notifications.notifications.length === 0 ? (
                                    <p className="p-6 text-center text-sm text-slate-500">Brak powiadomień.</p>
                                ) : (
                                    notifications.notifications.slice(0, 10).map((notification) => (
                                        <button
                                            key={notification.id}
                                            type="button"
                                            onClick={() => openNotification(notification)}
                                            className={`block w-full rounded-2xl p-3 text-left transition hover:bg-white/5 ${
                                                notification.read ? "opacity-65" : "bg-blue-500/5"
                                            }`}
                                        >
                                            <div className="flex gap-3">
                                                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                                                    notification.read ? "bg-slate-700" : "bg-cyan-400"
                                                }`} />
                                                <span className="min-w-0">
                                                    <span className="block text-sm font-black">{notification.title}</span>
                                                    <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500">
                                                        {notification.message}
                                                    </span>
                                                </span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className="hidden items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2 xl:flex">
                    <BsPersonCircle className="text-blue-400" size={22} />
                    <div className="min-w-0">
                        <p className="max-w-[180px] truncate text-sm font-semibold text-white">{email || "Użytkownik"}</p>
                        {role && <p className="text-xs text-slate-500">{role}</p>}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={logout}
                    aria-label="Wyloguj"
                    className="flex h-10 items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 text-sm font-bold text-red-300 transition hover:bg-red-600 hover:text-white sm:h-auto sm:py-2"
                >
                    <BsBoxArrowRight />
                    <span className="hidden sm:inline">Wyloguj</span>
                </button>
            </div>
        </header>
    );
}

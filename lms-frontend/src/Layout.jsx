import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import {
    BsBarChart,
    BsAward,
    BsBook,
    BsCalendarCheck,
    BsClipboardCheck,
    BsCreditCard,
    BsGrid1X2,
    BsInbox,
    BsPeople,
    BsPlusCircle,
    BsRocketTakeoff,
    BsShieldLock,
    BsX,
    BsArrowRepeat
} from "react-icons/bs";
import { apiFetch } from "./api/api";
import { useAuth } from "./context/AuthContext";

export default function Layout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const { user } = useAuth();
    const role = user?.role || "";

    const isLessonPage = location.pathname.startsWith("/lesson/");
    const closeMenu = () => setMobileMenuOpen(false);
    const linkClass = ({ isActive }) =>
        `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200 ${
            isActive
                ? "bg-cyan-400 text-slate-950 shadow-[0_8px_28px_rgba(34,211,238,0.18)]"
                : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
        }`;

    useEffect(() => {
        const heartbeat = () => {
            if (document.visibilityState === "visible") {
                apiFetch("/learning/heartbeat", { method: "POST" }).catch(() => {});
            }
        };
        heartbeat();
        const timer = window.setInterval(heartbeat, 60000);
        document.addEventListener("visibilitychange", heartbeat);
        return () => {
            window.clearInterval(timer);
            document.removeEventListener("visibilitychange", heartbeat);
        };
    }, []);

    if (isLessonPage) {
        return (
            <div className="min-h-screen bg-slate-950 text-white">
                <Outlet />
            </div>
        );
    }

    return (
        <div className="flex h-[100dvh] overflow-hidden bg-[#05070d] text-white">
            {mobileMenuOpen && (
                <button
                    type="button"
                    aria-label="Zamknij menu"
                    onClick={closeMenu}
                    className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
                />
            )}

            <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(17rem,86vw)] flex-col border-r border-white/[0.08] bg-[#070a12]/98 shadow-2xl transition-transform duration-300 lg:static lg:z-auto lg:w-60 lg:translate-x-0 lg:shadow-none ${
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}>
                <div className="flex items-center justify-between px-4 pb-5 pt-5">
                    <Link to="/courses" onClick={closeMenu} className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-600 shadow-lg shadow-cyan-500/20">
                            <BsRocketTakeoff size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tight">EduHub</h1>
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/70">Learn. Build. Grow.</p>
                        </div>
                    </Link>

                    <button
                        type="button"
                        aria-label="Zamknij menu"
                        onClick={closeMenu}
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white/5 hover:text-white lg:hidden"
                    >
                        <BsX size={28} />
                    </button>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
                    <NavLink to="/dashboard" onClick={closeMenu} className={linkClass}>
                        <BsGrid1X2 />
                        <span>Start</span>
                    </NavLink>
                    <NavLink to="/courses" onClick={closeMenu} className={linkClass}>
                        <BsBook />
                        <span>Ścieżki nauki</span>
                    </NavLink>
                    <NavLink to="/results" onClick={closeMenu} className={linkClass}>
                        <BsBarChart />
                        <span>Wyniki</span>
                    </NavLink>
                    <NavLink to="/exams" onClick={closeMenu} className={linkClass}>
                        <BsClipboardCheck />
                        <span>Egzaminy INF</span>
                    </NavLink>
                    <NavLink to="/learning-center" onClick={closeMenu} className={linkClass}>
                        <BsAward />
                        <span>Statystyki i nagrody</span>
                    </NavLink>
                    <NavLink to="/language-reviews" onClick={closeMenu} className={linkClass}>
                        <BsArrowRepeat />
                        <span>Powtórki językowe</span>
                    </NavLink>

                    {role === "ADMIN" && (
                        <>
                            <div className="px-3 pb-2 pt-6 text-[10px] font-black uppercase tracking-[0.22em] text-slate-600">
                                Strefa twórcy
                            </div>
                            <NavLink to="/admin" onClick={closeMenu} className={linkClass}>
                                <BsShieldLock />
                                <span>Panel admina</span>
                            </NavLink>
                            <NavLink to="/admin/users" onClick={closeMenu} className={linkClass}>
                                <BsPeople />
                                <span>Użytkownicy</span>
                            </NavLink>
                            <NavLink to="/admin/add-course" onClick={closeMenu} className={linkClass}>
                                <BsPlusCircle />
                                <span>Dodaj kurs</span>
                            </NavLink>
                            <NavLink to="/admin/submissions" onClick={closeMenu} className={linkClass}>
                                <BsInbox />
                                <span>Prace uczniów</span>
                            </NavLink>
                            <NavLink to="/admin/course-orders" onClick={closeMenu} className={linkClass}>
                                <BsCreditCard />
                                <span>Zamówienia kursów</span>
                            </NavLink>
                            <NavLink to="/admin/tutoring" onClick={closeMenu} className={linkClass}>
                                <BsCalendarCheck />
                                <span>Korepetycje</span>
                            </NavLink>
                        </>
                    )}
                </nav>

                <div className="mx-4 mb-4 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.04] px-3 py-3 text-xs leading-5 text-slate-500">
                    <span className="font-black text-cyan-300">Tryb skupienia</span><br />
                    Jedna lekcja dziennie buduje rytm.
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <Navbar onMenuClick={() => setMobileMenuOpen(true)} />
                <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_85%_-10%,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_15%_105%,rgba(124,58,237,0.10),transparent_28%),#05070d] p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

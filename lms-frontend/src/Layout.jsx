import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import {
    BsBarChart,
    BsBook,
    BsCalendarCheck,
    BsGrid1X2,
    BsInbox,
    BsPeople,
    BsPlusCircle,
    BsRocketTakeoff,
    BsShieldLock,
    BsX
} from "react-icons/bs";

export default function Layout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const token = localStorage.getItem("token");

    let role = "";
    let email = "";

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            role = payload.role || "";
            email = payload.sub || payload.email || "";
        } catch (error) {
            console.error("Token error", error);
        }
    }

    const isLessonPage = location.pathname.startsWith("/lesson/");
    const closeMenu = () => setMobileMenuOpen(false);
    const linkClass = ({ isActive }) =>
        `flex items-center gap-3 rounded-2xl px-4 py-3 font-bold transition ${
            isActive
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/20"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
        }`;

    if (isLessonPage) {
        return (
            <div className="min-h-screen bg-slate-950 text-white">
                <Outlet />
            </div>
        );
    }

    return (
        <div className="flex h-[100dvh] overflow-hidden bg-slate-950 text-white">
            {mobileMenuOpen && (
                <button
                    type="button"
                    aria-label="Zamknij menu"
                    onClick={closeMenu}
                    className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
                />
            )}

            <aside className={`fixed inset-y-0 left-0 z-50 flex w-[min(20rem,86vw)] flex-col border-r border-white/10 bg-slate-950 shadow-2xl transition-transform duration-300 lg:static lg:z-auto lg:w-72 lg:translate-x-0 lg:shadow-none xl:w-80 ${
                mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
            }`}>
                <div className="flex items-center justify-between border-b border-white/10 p-5 sm:p-6">
                    <Link to="/courses" onClick={closeMenu} className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/20 sm:h-12 sm:w-12">
                            <BsRocketTakeoff size={23} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black sm:text-2xl">EduHub</h1>
                            <p className="text-xs text-slate-500">Nauka programowania</p>
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

                <nav className="flex-1 space-y-2 overflow-y-auto p-4">
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

                    {role === "ADMIN" && (
                        <>
                            <div className="px-4 pb-2 pt-6 text-xs font-bold uppercase tracking-wider text-slate-600">
                                Administracja
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
                            <NavLink to="/admin/tutoring" onClick={closeMenu} className={linkClass}>
                                <BsCalendarCheck />
                                <span>Korepetycje</span>
                            </NavLink>
                        </>
                    )}
                </nav>

                <div className="border-t border-white/10 p-4">
                    <div className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-600/20 to-purple-600/10 p-4 sm:p-5">
                        <p className="mb-1 text-xs text-slate-400">Zalogowano jako</p>
                        <p className="break-all text-sm font-bold">{email || "Brak danych"}</p>
                        <p className="mt-2 text-xs text-blue-300">{role || "USER"}</p>
                    </div>
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <Navbar onMenuClick={() => setMobileMenuOpen(true)} />
                <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(147,51,234,0.12),transparent_35%),#030712] p-4 sm:p-6 lg:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

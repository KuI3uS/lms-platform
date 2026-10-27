import { useEffect, useRef, useState } from "react";
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
    BsShieldLock,
    BsX,
    BsArrowRepeat,
    BsKey
} from "react-icons/bs";
import skicodeLogo from "./assets/images/skicode-logo.png";
import { apiFetch } from "./api/api";
import { useAuth } from "./context/AuthContext";
import { getWorkspaceTheme, WORKSPACE_BACKGROUNDS } from "./utils/workspaceTheme";

export default function Layout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const { user } = useAuth();
    const role = user?.role || "";
    const sidebarRef = useRef(null);
    const menuTriggerRef = useRef(null);

    const isLessonPage = location.pathname.startsWith("/lesson/");
    const workspaceTheme = getWorkspaceTheme(location.pathname);
    const lightWorkspace = workspaceTheme === "light";
    const closeMenu = () => setMobileMenuOpen(false);
    const linkClass = ({ isActive }) =>
        `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 ${
            isActive
                ? "bg-teal-50 text-teal-800"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
        }`;

    useEffect(() => {
        const desktop = window.matchMedia("(min-width: 1024px)");
        if (!mobileMenuOpen || desktop.matches) return undefined;
        const sidebar = sidebarRef.current;
        const focusable = () => [...(sidebar?.querySelectorAll(
            'a[href], button:not([disabled]), [tabindex="0"]'
        ) || [])].filter(element => element.getClientRects().length > 0);
        focusable()[0]?.focus();
        const handleKey = event => {
            if (desktop.matches) return;
            if (event.key === "Escape") {
                event.preventDefault();
                setMobileMenuOpen(false);
            } else if (event.key === "Tab") {
                const items = focusable();
                const first = items[0];
                const last = items[items.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last?.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first?.focus();
                }
            }
        };
        const closeOnDesktop = event => {
            if (event.matches) setMobileMenuOpen(false);
        };
        document.addEventListener("keydown", handleKey);
        desktop.addEventListener("change", closeOnDesktop);
        return () => {
            document.removeEventListener("keydown", handleKey);
            desktop.removeEventListener("change", closeOnDesktop);
            menuTriggerRef.current?.focus();
        };
    }, [mobileMenuOpen]);

    useEffect(() => {
        const heartbeat = () => {
            if (document.visibilityState === "visible") {
                apiFetch("/learning/heartbeat", { method: "POST" }).catch(() => {});
            }
        };
        heartbeat();
        const timer = window.setInterval(heartbeat, 15000);
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
        <div className="workspace-shell flex h-[100dvh] overflow-hidden bg-[#f6f8fa] text-slate-900">
            {mobileMenuOpen && (
                <button
                    type="button"
                    aria-label="Zamknij menu"
                    tabIndex={-1}
                    onClick={closeMenu}
                    className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-[2px] lg:hidden"
                />
            )}

            <aside ref={sidebarRef} aria-label="Menu główne" className={`workspace-sidebar fixed inset-y-0 left-0 z-50 flex w-[min(17rem,86vw)] flex-col border-r border-slate-200 bg-white shadow-2xl transition-transform duration-200 lg:static lg:z-auto lg:w-60 lg:translate-x-0 lg:shadow-none ${
                mobileMenuOpen ? "visible translate-x-0" : "invisible -translate-x-full lg:visible"
            }`}>
                <div className="flex items-center justify-between px-5 pb-6 pt-6">
                    <Link to="/dashboard" onClick={closeMenu} className="flex items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
                        <img
                            src={skicodeLogo}
                            alt="Logo SKI/CODE"
                            className="h-10 w-10 shrink-0 rounded-xl border border-slate-100 bg-white object-cover"
                        />
                        <div>
                            <span className="block text-lg font-bold tracking-tight text-slate-950">EduHub</span>
                            <span className="block text-xs text-slate-500">Twoja przestrzeń nauki</span>
                        </div>
                    </Link>

                    <button
                        type="button"
                        aria-label="Zamknij menu"
                        onClick={closeMenu}
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 lg:hidden"
                    >
                        <BsX size={28} />
                    </button>
                </div>

                <nav aria-label="Nawigacja aplikacji" className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
                    <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Nauka</p>
                    <NavLink to="/dashboard" onClick={closeMenu} className={linkClass}>
                        <BsGrid1X2 />
                        <span>Start</span>
                    </NavLink>
                    <NavLink to="/courses" onClick={closeMenu} className={linkClass}>
                        <BsBook />
                        <span>Kursy</span>
                    </NavLink>
                    <NavLink to="/learning-center" onClick={closeMenu} className={linkClass}>
                        <BsAward />
                        <span>Postęp</span>
                    </NavLink>
                    <NavLink to="/language-reviews" onClick={closeMenu} className={linkClass}>
                        <BsArrowRepeat />
                        <span>Powtórki językowe</span>
                    </NavLink>
                    <p className="px-3 pb-2 pt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Narzędzia</p>
                    <NavLink to="/exams" onClick={closeMenu} className={linkClass}>
                        <BsClipboardCheck />
                        <span>Egzaminy INF</span>
                    </NavLink>
                    <NavLink to="/results" onClick={closeMenu} className={linkClass}>
                        <BsBarChart />
                        <span>Wyniki zadań</span>
                    </NavLink>
                    <NavLink to="/access-code" onClick={closeMenu} className={linkClass}>
                        <BsKey />
                        <span>Kod dostępu</span>
                    </NavLink>

                    {role === "ADMIN" && (
                        <>
                            <div className="px-3 pb-2 pt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                Twórca
                            </div>
                            <NavLink to="/admin" end onClick={closeMenu} className={linkClass}>
                                <BsShieldLock />
                                <span>Panel twórcy</span>
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
                            <NavLink to="/admin/access-codes" onClick={closeMenu} className={linkClass}>
                                <BsKey />
                                <span>Kody dostępu</span>
                            </NavLink>
                            <NavLink to="/admin/tutoring" onClick={closeMenu} className={linkClass}>
                                <BsCalendarCheck />
                                <span>Korepetycje</span>
                            </NavLink>
                        </>
                    )}
                </nav>

                <div className="mx-4 mb-5 border-t border-slate-100 px-2 pt-4 text-xs leading-5 text-slate-500">
                    <span className="font-semibold text-slate-700">Małe kroki, realny postęp.</span><br />
                    Ucz się w swoim tempie.
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <Navbar onMenuClick={event => {
                    menuTriggerRef.current = event.currentTarget;
                    setMobileMenuOpen(true);
                }} />
                <main style={{ backgroundColor: WORKSPACE_BACKGROUNDS[workspaceTheme] }} className={`workspace-main flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 ${lightWorkspace
                    ? "workspace-main--light text-slate-900"
                    : "workspace-main--dark text-white"}`}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

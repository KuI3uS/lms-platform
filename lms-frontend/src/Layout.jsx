import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import {
    BsGrid1X2,
    BsBook,
    BsBarChart,
    BsShieldLock,
    BsPeople,
    BsPlusCircle,
    BsInbox,
    BsCalendarCheck,
    BsRocketTakeoff
} from "react-icons/bs";

export default function Layout() {
    const token = localStorage.getItem("token");

    let role = "";
    let email = "";

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            role = payload.role || "";
            email = payload.sub || payload.email || "";
        } catch (e) {
            console.error("Token error", e);
        }
    }

    const location = useLocation();
    const isLessonPage = location.pathname.startsWith("/lesson/");

    const linkClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-2xl transition font-bold ${
            isActive
                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-600/20"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
        }`;

    if (isLessonPage) {
        return (
            <div className="min-h-screen bg-gray-950 text-white">
                <Outlet />
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
            <aside className="w-80 bg-gray-950 border-r border-white/10 flex flex-col">
                <div className="p-6 border-b border-white/10">
                    <Link to="/courses" className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <BsRocketTakeoff size={24} />
                        </div>

                        <div>
                            <h1 className="text-2xl font-black">
                                EduHub
                            </h1>
                            <p className="text-xs text-gray-500">
                                Nauka programowania
                            </p>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <NavLink to="/dashboard" className={linkClass}>
                        <BsGrid1X2 />
                        <span>Start</span>
                    </NavLink>

                    <NavLink to="/courses" className={linkClass}>
                        <BsBook />
                        <span>Ścieżki nauki</span>
                    </NavLink>

                    <NavLink to="/results" className={linkClass}>
                        <BsBarChart />
                        <span>Wyniki</span>
                    </NavLink>

                    {role === "ADMIN" && (
                        <>
                            <div className="pt-6 pb-2 px-4 text-xs uppercase tracking-wider text-gray-600 font-bold">
                                Administracja
                            </div>

                            <NavLink to="/admin" className={linkClass}>
                                <BsShieldLock />
                                <span>Panel admina</span>
                            </NavLink>

                            <NavLink to="/admin/users" className={linkClass}>
                                <BsPeople />
                                <span>Użytkownicy</span>
                            </NavLink>

                            <NavLink to="/admin/add-course" className={linkClass}>
                                <BsPlusCircle />
                                <span>Dodaj kurs</span>
                            </NavLink>

                            <NavLink to="/admin/submissions" className={linkClass}>
                                <BsInbox />
                                <span>Prace uczniów</span>
                            </NavLink>

                            <NavLink to="/admin/tutoring" className={linkClass}>
                                <BsCalendarCheck />
                                <span>Korepetycje</span>
                            </NavLink>
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-white/10">
                    <div className="rounded-3xl bg-gradient-to-br from-blue-600/20 to-purple-600/10 border border-blue-500/20 p-5">
                        <p className="text-xs text-gray-400 mb-1">
                            Zalogowano jako
                        </p>

                        <p className="text-sm font-bold break-all">
                            {email || "Brak danych"}
                        </p>

                        <p className="text-xs text-blue-300 mt-2">
                            {role || "USER"}
                        </p>
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <Navbar />

                <main className="flex-1 overflow-auto p-8 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.18),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(147,51,234,0.12),transparent_35%),#030712]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
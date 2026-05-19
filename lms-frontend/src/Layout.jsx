import { Link, NavLink, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import {
    BsGrid1X2,
    BsBook,
    BsBarChart,
    BsShieldLock,
    BsPeople,
    BsPlusCircle,
    BsInbox
} from "react-icons/bs";

export default function Layout() {
    const token = localStorage.getItem("token");

    let role = "";
    let email = "";

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            role = payload.role;
            email = payload.sub || payload.email || "";
        } catch (e) {
            console.error("Token error", e);
        }
    }

    const linkClass = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium ${
            isActive
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                : "text-gray-300 hover:bg-gray-800 hover:text-white"
        }`;

    return (
        <div className="flex h-screen bg-gray-950 text-white">
            <aside className="w-72 bg-gray-900 border-r border-gray-800 flex flex-col">
                <div className="p-6 border-b border-gray-800">
                    <Link to="/">
                        <h1 className="text-2xl font-bold">LMS Panel</h1>
                        <p className="text-sm text-gray-400 mt-1">
                            Rola: {role || "USER"}
                        </p>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    <NavLink to="/dashboard" className={linkClass}>
                        <BsGrid1X2 />
                        <span>Dashboard</span>
                    </NavLink>

                    <NavLink to="/courses" className={linkClass}>
                        <BsBook />
                        <span>Kursy</span>
                    </NavLink>

                    <NavLink to="/results" className={linkClass}>
                        <BsBarChart />
                        <span>Wyniki</span>
                    </NavLink>

                    {role === "ADMIN" && (
                        <>
                            <div className="pt-6 pb-2 px-4 text-xs uppercase tracking-wider text-gray-500">
                                Administracja
                            </div>

                            <NavLink to="/admin" className={linkClass}>
                                <BsShieldLock />
                                <span>Panel Admina</span>
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
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <div className="bg-gray-800 rounded-xl p-4">
                        <p className="text-xs text-gray-400 mb-1">Zalogowano jako</p>
                        <p className="text-sm font-semibold break-all">
                            {email || "Brak danych"}
                        </p>
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <Navbar />

                <main className="flex-1 overflow-auto p-8 bg-gray-950">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
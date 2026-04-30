import { Link, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";

export default function Layout() {

    const token = localStorage.getItem("token");

    let role = "";

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            role = payload.role;
        } catch (e) {
            console.error("Token error", e);
        }
    }

    return (
        <div className="flex h-screen bg-gray-900 text-white">

            {/* SIDEBAR */}
            <div className="w-60 bg-gray-800 p-6 flex flex-col gap-4">

                {role === "ADMIN" && (
                    <div className="pt-4 border-t border-gray-700 space-y-2">
                        <Link to="/admin" className="block hover:text-red-400">
                            ⚙️ Panel Admina
                        </Link>
                    </div>
                )}

                <Link to="/dashboard">🏠 Dashboard</Link>
                <Link to="/">📚 Kursy</Link>
                <Link to="/results">📊 Wyniki</Link>

            </div>

            {/* MAIN */}
            <div className="flex-1 flex flex-col">

                <Navbar />

                <div className="p-6 overflow-auto">
                    <Outlet />
                </div>

            </div>
        </div>
    );
}
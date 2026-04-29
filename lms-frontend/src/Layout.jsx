import { Link } from "react-router-dom";
import Navbar from "./components/Navbar";

export default function Layout({ children }) {

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


                <Link to="/dashboard" className="hover:text-blue-400">
                    🏠 Dashboard
                </Link>

                <Link to="/" className="hover:text-blue-400">
                    📚 Kursy
                </Link>

                <Link to="/results" className="hover:text-blue-400">
                    📊 Wyniki
                </Link>

            </div>

            {/* MAIN */}
            <div className="flex-1 flex flex-col">

                <Navbar />

                <div className="p-6 overflow-auto">
                    {children}
                </div>

            </div>
        </div>
    );
}
import { logout } from "../api/api";
import {
    BsBell,
    BsFire,
    BsPersonCircle,
    BsRocketTakeoff
} from "react-icons/bs";

export default function Navbar() {
    const token = localStorage.getItem("token");

    let email = "";
    let role = "";

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            email = payload.sub || payload.email || "";
            role = payload.role || "";
        } catch (e) {
            console.error("Błędny token", e);
        }
    }

    return (
        <header className="h-20 bg-gray-950/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-8">
            <div>
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <BsRocketTakeoff className="text-white" size={22} />
                    </div>

                    <div>
                        <h1 className="text-white font-black text-xl">
                            EduHub
                        </h1>

                        <p className="text-xs text-gray-400">
                            Platforma nauki programowania
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden md:flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-300 px-4 py-2 rounded-2xl">
                    <BsFire />
                    <span className="text-sm font-bold">Seria: 0 dni</span>
                </div>

                <div className="hidden md:flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 px-4 py-2 rounded-2xl">
                    <span className="text-sm font-bold">0 XP</span>
                </div>

                <button className="w-11 h-11 rounded-2xl bg-gray-900 border border-gray-800 hover:border-blue-500 flex items-center justify-center transition">
                    <BsBell className="text-gray-300" />
                </button>

                <div className="hidden lg:flex items-center gap-3 bg-gray-900 border border-gray-800 rounded-2xl px-4 py-2">
                    <BsPersonCircle className="text-blue-400" size={22} />

                    <div>
                        <p className="text-sm font-semibold text-white max-w-[220px] truncate">
                            {email || "Użytkownik"}
                        </p>

                        {role && (
                            <p className="text-xs text-gray-500">
                                {role}
                            </p>
                        )}
                    </div>
                </div>

                <button
                    onClick={logout}
                    className="bg-red-500/10 hover:bg-red-600 border border-red-500/30 text-red-300 hover:text-white px-4 py-2 rounded-2xl text-sm font-bold transition"
                >
                    Wyloguj
                </button>
            </div>
        </header>
    );
}
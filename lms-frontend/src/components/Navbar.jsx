import { logout } from "../api/api";
import {
    BsBell,
    BsBoxArrowRight,
    BsFire,
    BsList,
    BsPersonCircle,
    BsRocketTakeoff
} from "react-icons/bs";

export default function Navbar({ onMenuClick }) {
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

    return (
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-slate-950/90 px-3 backdrop-blur-xl sm:h-20 sm:px-5 lg:px-8">
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
                    <span className="text-sm font-bold">Seria: 0 dni</span>
                </div>
                <div className="hidden items-center gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-blue-300 md:flex">
                    <span className="text-sm font-bold">0 XP</span>
                </div>
                <button
                    type="button"
                    aria-label="Powiadomienia"
                    className="hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 transition hover:border-blue-500 sm:flex sm:h-11 sm:w-11 sm:rounded-2xl"
                >
                    <BsBell className="text-slate-300" />
                </button>
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

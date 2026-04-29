import { logout } from "../api/api";

export default function Navbar() {
    const token = localStorage.getItem("token");

    let email = "";
    let role = "";

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            email = payload.sub;
            role = payload.role;
        } catch (e) {
            console.error("Błędny token", e);
        }
    }

    return (
        <div className="h-16 bg-gray-800 flex items-center justify-between px-6 border-b border-gray-700">
            <div>
                <h1 className="text-white font-bold text-lg">LMS Panel</h1>
                {role && (
                    <p className="text-xs text-gray-400">
                        Rola: {role}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-4">
                <span className="text-gray-300 text-sm">
                    {email}
                </span>

                <button
                    onClick={logout}
                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white text-sm"
                >
                    Wyloguj
                </button>
            </div>
        </div>
    );
}
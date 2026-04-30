import { useState } from "react";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const login = async () => {
        setError("");
        setLoading(true);

        try {
            const res = await fetch("http://localhost:8080/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            if (!res.ok) {
                throw new Error("Nieprawidłowy email lub hasło");
            }

            const data = await res.json();

            localStorage.setItem("token", data.token);

            window.location.href = "/";
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">

            <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-96">

                <h2 className="text-2xl font-bold text-white mb-6 text-center">
                    Logowanie
                </h2>

                {error && (
                    <div className="bg-red-500/20 text-red-400 p-2 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <input
                    className="w-full mb-3 p-3 rounded bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <input
                    className="w-full mb-4 p-3 rounded bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Hasło"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                <button
                    onClick={login}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 transition p-3 rounded text-white font-semibold disabled:opacity-50"
                >
                    {loading ? "Logowanie..." : "Zaloguj się"}
                </button>

                <p className="text-sm text-gray-400">
                    Nie masz konta?{" "}
                    <a href="/register" className="text-blue-400">
                        Zarejestruj się
                    </a>
                </p>

            </div>
        </div>
    );
}
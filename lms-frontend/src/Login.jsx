import { useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "./api/api";
import { useAuth } from "./context/AuthContext";

export default function Login() {
    const { completeLogin } = useAuth();
    const sessionExpired = new URLSearchParams(window.location.search)
        .get("session") === "expired";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState(
        sessionExpired
            ? "Sesja wygasła. Zaloguj się ponownie — wrócisz do poprzedniej strony."
            : ""
    );
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);

    const login = async (event) => {
        event?.preventDefault();
        setError("");
        setMessage("");
        setLoading(true);

        try {
            const data = await apiFetch("/auth/login", {
                method: "POST",
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    password
                })
            });

            completeLogin(data);
            const storedDestination = sessionStorage.getItem("eduhub:return-after-login");
            const destination = storedDestination?.startsWith("/")
                && !storedDestination.startsWith("//")
                ? storedDestination
                : "/courses";

            sessionStorage.removeItem("eduhub:return-after-login");
            window.location.href = destination;
        } catch (e) {
            setError(e.message || "Nie udało się zalogować.");
        } finally {
            setLoading(false);
        }
    };

    const resendVerification = async () => {
        if (!email.trim()) {
            setError("Wpisz adres email, na który mamy wysłać link.");
            return;
        }

        setResending(true);
        setError("");
        setMessage("");
        try {
            await apiFetch("/auth/resend-verification", {
                method: "POST",
                body: JSON.stringify({ email: email.trim().toLowerCase() })
            });
            setMessage("Jeśli konto oczekuje na aktywację, wysłaliśmy nowy link potwierdzający.");
        } catch (resendError) {
            setError(resendError.message || "Nie udało się wysłać linku.");
        } finally {
            setResending(false);
        }
    };

    const accountNotActive = error.toLowerCase().includes("aktyw")
        || error.toLowerCase().includes("potwierd");

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900">
            <form
                onSubmit={login}
                className="bg-gray-800 p-8 rounded-2xl shadow-lg w-[min(24rem,calc(100vw-2rem))]"
            >
                <h2 className="text-2xl font-bold text-white mb-6 text-center">
                    Logowanie
                </h2>

                {error && (
                    <div role="alert" className="bg-red-500/20 text-red-300 p-3 rounded-xl mb-4 text-sm">
                        {error}
                    </div>
                )}
                {message && (
                    <div className="bg-emerald-500/15 text-emerald-300 p-3 rounded-xl mb-4 text-sm">
                        {message}
                    </div>
                )}

                <input
                    className="w-full mb-3 p-3 rounded bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    className="w-full mb-4 p-3 rounded bg-gray-700 text-white outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Hasło"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 transition p-3 rounded text-white font-semibold disabled:opacity-50"
                >
                    {loading ? "Logowanie..." : "Zaloguj się"}
                </button>

                {accountNotActive && (
                    <button
                        type="button"
                        onClick={resendVerification}
                        disabled={resending}
                        className="mt-3 w-full rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 font-semibold text-cyan-300 disabled:opacity-50"
                    >
                        {resending ? "Wysyłanie..." : "Wyślij ponownie link aktywacyjny"}
                    </button>
                )}

                <p className="text-sm text-gray-400 mt-3 text-center">
                    Nie masz konta?{" "}
                    <Link to="/register" className="text-blue-400">
                        Zarejestruj się
                    </Link>
                </p>
                <p className="text-sm text-gray-400 mt-3 text-center">
                    Nie pamiętasz hasła?{" "}
                    <Link to="/forgot-password" className="text-blue-400 hover:text-blue-300">
                        Zresetuj hasło
                    </Link>
                </p>
            </form>
        </div>
    );
}

import { useState } from "react";
import { useSearchParams } from "react-router-dom";

export default function ResetPassword() {
    const [params] = useSearchParams();
    const token = params.get("token");

    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        if (!password.trim()) {
            alert("Podaj nowe hasło");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch("https://lms-platform-1-dcxg.onrender.com/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token,
                    newPassword: password
                })
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Błąd resetu hasła");
            }

            alert("Hasło zostało zmienione. Możesz się zalogować.");
            window.location.href = "/login";
        } catch (e) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
            <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl w-96 space-y-4">
                <h1 className="text-2xl font-bold">Nowe hasło</h1>

                <input
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    type="password"
                    placeholder="Nowe hasło"
                    className="w-full bg-gray-800 border border-gray-700 p-3 rounded-xl"
                />

                <button
                    onClick={submit}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold disabled:opacity-50"
                >
                    {loading ? "Zapisywanie..." : "Zmień hasło"}
                </button>
            </div>
        </div>
    );
}
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiFetch } from "./api/api";
import { useFeedback } from "./context/FeedbackContext";

export default function ResetPassword() {
    const { showToast } = useFeedback();
    const [params] = useSearchParams();
    const token = params.get("token");

    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const submit = async () => {
        if (!token) {
            setError("Link do resetu hasła jest nieprawidłowy.");
            return;
        }
        if (password.length < 8) {
            setError("Nowe hasło musi mieć co najmniej 8 znaków.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            await apiFetch("/auth/reset-password", {
                method: "POST",
                body: JSON.stringify({
                    token,
                    newPassword: password
                })
            });

            showToast("Hasło zostało zmienione. Możesz się teraz zalogować.", "success");
            window.setTimeout(() => { window.location.href = "/login"; }, 900);
        } catch (e) {
            setError(e.message || "Nie udało się zmienić hasła.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
            <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl w-96 space-y-4">
                <h1 className="text-2xl font-bold">Nowe hasło</h1>

                {error && (
                    <div role="alert" className="rounded-xl bg-red-500/15 p-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                <input
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    type="password"
                    minLength={8}
                    autoComplete="new-password"
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

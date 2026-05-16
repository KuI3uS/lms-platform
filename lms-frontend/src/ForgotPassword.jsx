import { useState } from "react";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        if (!email.trim()) {
            alert("Podaj email");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch("http://localhost:8080/api/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            });

            if (!res.ok) {
                throw new Error("Błąd wysyłania linku");
            }

            alert("Jeśli konto istnieje, link do resetu hasła został wysłany.");
        } catch (e) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
            <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl w-96 space-y-4">
                <h1 className="text-2xl font-bold">Reset hasła</h1>

                <p className="text-gray-400 text-sm">
                    Podaj email, a wyślemy link do ustawienia nowego hasła.
                </p>

                <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full bg-gray-800 border border-gray-700 p-3 rounded-xl"
                />

                <button
                    onClick={submit}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold disabled:opacity-50"
                >
                    {loading ? "Wysyłanie..." : "Wyślij link"}
                </button>
            </div>
        </div>
    );
}
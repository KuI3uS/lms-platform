import { useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "./api/api";

export default function Register() {
    const [form, setForm] = useState({
        email: "",
        password: "",
        firstName: "",
        lastName: ""
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [created, setCreated] = useState(false);

    const update = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const submit = async (event) => {
        event?.preventDefault();
        if (!form.email || !form.password) {
            setError("Uzupełnij email i hasło.");
            return;
        }
        if (form.password.length < 8) {
            setError("Hasło musi mieć co najmniej 8 znaków.");
            return;
        }

        try {
            setLoading(true);
            setError("");

            await apiFetch("/auth/register", {
                method: "POST",
                body: JSON.stringify({
                    ...form,
                    email: form.email.trim().toLowerCase()
                })
            });

            setCreated(true);
        } catch (e) {
            setError(e.message || "Nie udało się utworzyć konta.");
        } finally {
            setLoading(false);
        }
    };

    if (created) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4 text-white">
                <div className="w-full max-w-md rounded-3xl border border-emerald-500/20 bg-gray-800 p-8 text-center">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-3xl text-emerald-300">✓</div>
                    <h1 className="mt-5 text-2xl font-black">Sprawdź swoją skrzynkę</h1>
                    <p className="mt-3 leading-7 text-gray-400">
                        Konto zostało utworzone. Kliknij link potwierdzający wysłany na
                        <strong className="block text-white">{form.email.trim()}</strong>
                    </p>
                    <Link
                        to="/login"
                        className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-bold"
                    >
                        Przejdź do logowania
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
            <form
                onSubmit={submit}
                className="bg-gray-800 p-8 rounded-xl space-y-4 w-[min(24rem,calc(100vw-2rem))]"
            >
                <h2 className="text-2xl font-bold">Rejestracja</h2>

                {error && (
                    <div role="alert" className="rounded-xl bg-red-500/15 p-3 text-sm text-red-300">
                        {error}
                    </div>
                )}

                <input
                    className="w-full p-3 bg-gray-700 rounded"
                    placeholder="Email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    required
                />

                <input
                    className="w-full p-3 bg-gray-700 rounded"
                    placeholder="Hasło"
                    type="password"
                    minLength={8}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    required
                />

                <input
                    className="w-full p-3 bg-gray-700 rounded"
                    placeholder="Imię"
                    value={form.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                />

                <input
                    className="w-full p-3 bg-gray-700 rounded"
                    placeholder="Nazwisko"
                    value={form.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded font-semibold disabled:opacity-50"
                >
                    {loading ? "Tworzenie..." : "Zarejestruj"}
                </button>

                <p className="text-center text-sm text-gray-400">
                    Masz już konto? <Link to="/login" className="text-blue-400">Zaloguj się</Link>
                </p>
            </form>

        </div>
    );
}

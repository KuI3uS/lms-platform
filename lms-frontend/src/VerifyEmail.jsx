import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiFetch } from "./api/api";

export default function VerifyEmail() {
    const [params] = useSearchParams();
    const token = params.get("token");
    const [status, setStatus] = useState(token ? "loading" : "error");
    const [message, setMessage] = useState(
        token
            ? "Potwierdzamy Twój adres email..."
            : "W linku brakuje tokenu potwierdzającego."
    );

    useEffect(() => {
        let active = true;

        if (!token) {
            return undefined;
        }

        apiFetch(`/auth/verify-email?token=${encodeURIComponent(token)}`)
            .then((response) => {
                if (!active) return;
                setStatus("success");
                setMessage(response?.message || "Adres email został potwierdzony.");
            })
            .catch((error) => {
                if (!active) return;
                setStatus("error");
                setMessage(error.message || "Nie udało się potwierdzić adresu email.");
            });

        return () => {
            active = false;
        };
    }, [token]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4 text-white">
            <main className="w-full max-w-lg rounded-[32px] border border-white/10 bg-gray-900 p-8 text-center shadow-2xl">
                <div className={`mx-auto grid h-20 w-20 place-items-center rounded-full text-3xl ${
                    status === "success"
                        ? "bg-emerald-500/15 text-emerald-300"
                        : status === "error"
                            ? "bg-red-500/15 text-red-300"
                            : "bg-blue-500/15 text-blue-300"
                }`}>
                    {status === "loading" ? (
                        <span className="h-9 w-9 animate-spin rounded-full border-4 border-current border-t-transparent" />
                    ) : status === "success" ? "✓" : "!"}
                </div>

                <h1 className="mt-6 text-3xl font-black">
                    {status === "loading"
                        ? "Aktywacja konta"
                        : status === "success"
                            ? "Konto aktywne"
                            : "Nie udało się aktywować konta"}
                </h1>
                <p className="mt-4 leading-7 text-gray-400">{message}</p>

                {status !== "loading" && (
                    <Link
                        to="/login"
                        className="mt-7 inline-flex rounded-xl bg-blue-600 px-6 py-3 font-bold transition hover:bg-blue-500"
                    >
                        {status === "success" ? "Zaloguj się" : "Przejdź do logowania"}
                    </Link>
                )}
            </main>
        </div>
    );
}

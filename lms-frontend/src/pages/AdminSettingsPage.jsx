import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    BsCheckCircle,
    BsCreditCard,
    BsEnvelopeCheck,
    BsGear,
    BsPersonBadge,
    BsShieldCheck
} from "react-icons/bs";
import { API_URL, apiFetch } from "../api/api";

export default function AdminSettingsPage() {
    const [profile, setProfile] = useState(null);
    const [status, setStatus] = useState("loading");
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        apiFetch("/me")
            .then((data) => {
                if (!active) return;
                setProfile(data);
                setStatus("online");
            })
            .catch((loadError) => {
                if (!active) return;
                setStatus("offline");
                setError(loadError.message || "Backend nie odpowiada.");
            });
        return () => {
            active = false;
        };
    }, []);

    return (
        <div className="mx-auto max-w-6xl space-y-8 text-white">
            <header className="rounded-[34px] border border-slate-500/20 bg-gradient-to-br from-slate-800 to-slate-950 p-7 sm:p-10">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-300">EduHub System</p>
                <h1 className="mt-3 text-4xl font-black sm:text-5xl">Ustawienia</h1>
                <p className="mt-4 max-w-3xl text-slate-400">
                    Konfiguracja treści i płatności jest przypisana do konkretnych kursów.
                    Tutaj możesz sprawdzić połączenie platformy i najważniejsze punkty konfiguracji.
                </p>
            </header>

            {error && (
                <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
                    {error}
                </div>
            )}

            <section className="grid gap-5 lg:grid-cols-2">
                <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                    <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-500/15 text-blue-300">
                            <BsShieldCheck size={22} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Połączenie z API</p>
                            <p className="font-black">
                                {status === "loading" ? "Sprawdzanie..." : status === "online" ? "Działa poprawnie" : "Brak połączenia"}
                            </p>
                        </div>
                    </div>
                    <p className="mt-5 break-all rounded-2xl bg-black/20 p-4 font-mono text-sm text-slate-400">
                        {API_URL}
                    </p>
                </article>

                <article className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                    <div className="flex items-center gap-3">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/15 text-violet-300">
                            <BsPersonBadge size={22} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Konto administratora</p>
                            <p className="font-black">{profile?.email || "Pobieranie danych..."}</p>
                        </div>
                    </div>
                    <p className="mt-5 text-sm leading-6 text-slate-400">
                        Uprawnienia administratora są sprawdzane na backendzie dla każdej operacji zapisu.
                    </p>
                </article>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
                <h2 className="flex items-center gap-3 text-2xl font-black">
                    <BsGear className="text-slate-300" /> Konfiguracja platformy
                </h2>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <SettingCard
                        icon={<BsCreditCard />}
                        title="Ceny i płatności"
                        text="Cena oraz bezpieczny link płatności są ustawiane osobno dla każdego kursu."
                        to="/admin/courses"
                        action="Otwórz kursy"
                    />
                    <SettingCard
                        icon={<BsEnvelopeCheck />}
                        title="Weryfikacja email"
                        text="Nowe konta otrzymują link ważny 24 godziny. Link można wysłać ponownie z logowania."
                        to="/admin/users"
                        action="Otwórz użytkowników"
                    />
                    <SettingCard
                        icon={<BsCheckCircle />}
                        title="Kontrola publikacji"
                        text="Tylko opublikowane kursy są widoczne w katalogu zwykłego użytkownika."
                        to="/admin/courses"
                        action="Sprawdź publikację"
                    />
                </div>
            </section>
        </div>
    );
}

function SettingCard({ icon, title, text, to, action }) {
    return (
        <article className="rounded-2xl border border-white/10 bg-slate-950/60 p-5">
            <div className="text-2xl text-cyan-300">{icon}</div>
            <h3 className="mt-4 font-black">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
            <Link to={to} className="mt-5 inline-flex font-bold text-cyan-300">
                {action} →
            </Link>
        </article>
    );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BsArrowRight, BsBook, BsCheck2, BsClipboard, BsEnvelope, BsKey, BsLifePreserver, BsTools } from "react-icons/bs";
import skicodeLogo from "../assets/images/skicode-logo.png";
import { SUPPORT_EMAIL, supportMailto } from "../utils/support";

const topics = [
    { icon: BsKey, title: "Konto i logowanie", description: "Problemy z logowaniem, aktywacją konta lub resetowaniem hasła.", subject: "konto i logowanie" },
    { icon: BsBook, title: "Dostęp do kursu", description: "Pytania o zakupiony kurs, dostępne materiały lub widoczność lekcji.", subject: "dostęp do kursu" },
    { icon: BsTools, title: "Problem techniczny", description: "Błąd w lekcji, zadaniu albo działaniu platformy.", subject: "zgłoszenie problemu technicznego" }
];

export default function SupportPage() {
    const [copyStatus, setCopyStatus] = useState("");

    useEffect(() => {
        const previousTitle = document.title;
        document.title = "Pomoc i kontakt — EduHub";
        return () => { document.title = previousTitle; };
    }, []);

    async function copyEmail() {
        try {
            await navigator.clipboard.writeText(SUPPORT_EMAIL);
            setCopyStatus("Adres e-mail został skopiowany.");
        } catch {
            setCopyStatus("Zaznacz widoczny adres e-mail i skopiuj go ręcznie.");
        }
    }

    return (
        <div className="min-h-screen bg-[#f6f8fa] text-slate-900">
            <header className="border-b border-slate-200 bg-white">
                <nav aria-label="Nawigacja pomocy" className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
                    <Link reloadDocument to="/" className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
                        <img src={skicodeLogo} alt="" className="h-10 w-10 rounded-xl border border-slate-100 object-cover" />
                        <span className="text-xl font-bold tracking-tight">EduHub</span>
                    </Link>
                    <Link to="/courses" className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-slate-600 transition hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
                        Przejdź do kursów <BsArrowRight aria-hidden="true" />
                    </Link>
                </nav>
            </header>

            <main className="mx-auto max-w-6xl px-5 pb-16 pt-12 sm:px-8 sm:pt-16">
                <div className="max-w-2xl">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-teal-700"><BsLifePreserver aria-hidden="true" className="text-lg" /> Pomoc i kontakt</p>
                    <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Potrzebujesz pomocy?</h1>
                    <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">Masz pytanie o konto, dostęp do kursu albo działanie lekcji? Skontaktuj się z pomocą techniczną EduHub.</p>
                </div>

                <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                    <section aria-labelledby="support-email-title" className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-50 text-2xl text-teal-700"><BsEnvelope aria-hidden="true" /></div>
                        <h2 id="support-email-title" className="mt-6 text-xl font-bold">Napisz do nas</h2>
                        <a href={supportMailto()} className="mt-3 inline-block max-w-full break-all rounded-lg text-lg font-semibold text-teal-800 underline decoration-teal-200 underline-offset-4 hover:decoration-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 sm:text-2xl">{SUPPORT_EMAIL}</a>
                        <div className="mt-7 flex flex-wrap gap-3">
                            <a href={supportMailto()} className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2">Napisz wiadomość <BsArrowRight aria-hidden="true" /></a>
                            <button type="button" onClick={copyEmail} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"><BsClipboard aria-hidden="true" /> Kopiuj adres</button>
                        </div>
                        <p className="mt-4 text-sm leading-6 text-slate-500">Przycisk otworzy Twój program pocztowy. Możesz też skopiować adres do swojej poczty.</p>
                        <p role="status" className="mt-2 min-h-5 text-sm font-medium text-teal-800">{copyStatus}</p>
                    </section>

                    <section aria-labelledby="support-details-title" className="rounded-3xl border border-teal-100 bg-teal-50/60 p-6 sm:p-8">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Sprawniej rozwiążemy problem</p>
                        <h2 id="support-details-title" className="mt-3 text-xl font-bold">Co warto dołączyć do wiadomości?</h2>
                        <ul className="mt-6 space-y-5 text-sm leading-6 text-slate-600">
                            {[
                                ["Nazwę kursu i lekcji", "Wskaż miejsce, którego dotyczy Twoje pytanie."],
                                ["Krótki opis sytuacji", "Napisz, co próbujesz zrobić i co dzieje się po wykonaniu tej czynności."],
                                ["Komunikat błędu", "Jeśli się pojawił, skopiuj jego treść lub dołącz zrzut ekranu."]
                            ].map(([title, description]) => <li key={title} className="flex gap-3"><BsCheck2 aria-hidden="true" className="mt-1 shrink-0 text-lg text-teal-700" /><span><strong className="block font-semibold text-slate-900">{title}</strong>{description}</span></li>)}
                        </ul>
                    </section>
                </div>

                <section aria-labelledby="support-topics-title" className="mt-12">
                    <h2 id="support-topics-title" className="text-xl font-bold">Wybierz temat wiadomości</h2>
                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                        {topics.map(({ icon: Icon, title, description, subject }) => <a key={subject} href={supportMailto(subject)} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-teal-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
                            <Icon aria-hidden="true" className="text-xl text-teal-700" />
                            <h3 className="mt-5 font-bold">{title}</h3>
                            <p className="mb-6 mt-2 text-sm leading-6 text-slate-600">{description}</p>
                            <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-teal-800">Napisz w tej sprawie <BsArrowRight aria-hidden="true" className="transition group-hover:translate-x-1" /></span>
                        </a>)}
                    </div>
                </section>
            </main>
            <footer className="mx-auto max-w-6xl border-t border-slate-200 px-5 py-6 text-sm text-slate-500 sm:px-8">EduHub · Pomoc techniczna</footer>
        </div>
    );
}

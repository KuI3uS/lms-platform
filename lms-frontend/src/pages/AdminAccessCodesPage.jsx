import { useEffect, useState } from "react";
import { BsClipboardCheck, BsKey, BsTrash } from "react-icons/bs";
import { apiFetch } from "../api/api";

const statusLabels = {
    ACTIVE: "Aktywny",
    REDEEMED: "Wykorzystany",
    EXPIRED: "Wygasł",
    REVOKED: "Unieważniony"
};

export default function AdminAccessCodesPage() {
    const [courses, setCourses] = useState([]);
    const [codes, setCodes] = useState([]);
    const [courseId, setCourseId] = useState("");
    const [accessType, setAccessType] = useState("THIRTY_DAYS");
    const [generatedCode, setGeneratedCode] = useState("");
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        Promise.all([apiFetch("/courses"), apiFetch("/access-codes")])
            .then(([courseData, codeData]) => {
                if (!active) return;
                setCourses(courseData || []);
                setCodes(codeData || []);
                if (courseData?.length) setCourseId(String(courseData[0].id));
            })
            .catch((e) => { if (active) setError(e.message); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, []);

    const createCode = async (event) => {
        event.preventDefault();
        try {
            setBusy(true);
            setError("");
            const created = await apiFetch("/access-codes", {
                method: "POST",
                body: JSON.stringify({ courseId: Number(courseId), accessType })
            });
            setGeneratedCode(created.code);
            setCodes((current) => [created, ...current]);
        } catch (e) {
            setError(e.message || "Nie udało się wygenerować kodu.");
        } finally {
            setBusy(false);
        }
    };

    const revoke = async (id) => {
        if (!window.confirm("Unieważnić ten kod? Nie będzie można go wykorzystać.")) return;
        try {
            setBusy(true);
            const updated = await apiFetch(`/access-codes/${id}`, { method: "DELETE" });
            setCodes((current) => current.map((item) => item.id === id ? updated : item));
        } catch (e) {
            setError(e.message || "Nie udało się unieważnić kodu.");
        } finally {
            setBusy(false);
        }
    };

    const copy = async () => {
        await navigator.clipboard.writeText(generatedCode);
    };

    if (loading) return <div className="p-10 text-slate-400">Ładowanie kodów…</div>;

    return (
        <div className="mx-auto max-w-6xl space-y-7 text-white">
            <section className="rounded-[34px] border border-violet-500/20 bg-gradient-to-br from-slate-950 via-violet-950 to-blue-950 p-7 sm:p-10">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-violet-300">EduHub Creator</p>
                <h1 className="mt-3 text-4xl font-black sm:text-5xl">Kody dostępu</h1>
                <p className="mt-4 max-w-3xl text-slate-300">Każdy kod działa tylko raz. Niewykorzystany automatycznie wygasa po 14 dniach.</p>
            </section>

            {error && <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">{error}</div>}

            <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/[0.04] p-6 lg:grid-cols-[1fr_360px]">
                <form onSubmit={createCode} className="space-y-5">
                    <label className="block space-y-2">
                        <span className="text-sm font-black text-slate-300">Kurs</span>
                        <select value={courseId} onChange={(e) => setCourseId(e.target.value)} required className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3">
                            {courses.map((course) => <option key={course.id} value={course.id}>{course.title || course.name}</option>)}
                        </select>
                    </label>
                    <div>
                        <p className="text-sm font-black text-slate-300">Rodzaj dostępu</p>
                        <div className="mt-2 grid gap-3 sm:grid-cols-2">
                            {[['THIRTY_DAYS', '30 dni', 'Dostęp wygasa po 30 dniach'], ['UNLIMITED', 'Bezterminowy', 'Dostęp bez daty końcowej']].map(([value, title, text]) => (
                                <button key={value} type="button" onClick={() => setAccessType(value)} className={`rounded-2xl border p-4 text-left ${accessType === value ? "border-cyan-300 bg-cyan-300/10" : "border-white/10 bg-black/20"}`}>
                                    <strong>{title}</strong><span className="mt-1 block text-xs text-slate-500">{text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <button disabled={busy || !courseId} className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 font-black disabled:opacity-50">
                        <BsKey /> {busy ? "Generowanie…" : "Wygeneruj kod jednorazowy"}
                    </button>
                </form>

                <div className="rounded-3xl border border-dashed border-cyan-400/30 bg-cyan-400/[0.05] p-6">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Nowy kod</p>
                    {generatedCode ? <>
                        <p className="mt-5 break-all font-mono text-2xl font-black tracking-wider">{generatedCode}</p>
                        <button type="button" onClick={copy} className="mt-5 flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 font-bold"><BsClipboardCheck /> Kopiuj kod</button>
                        <p className="mt-4 text-xs leading-5 text-amber-200">Skopiuj go teraz. Pełny kod nie będzie później ponownie wyświetlany.</p>
                    </> : <p className="mt-5 text-sm leading-6 text-slate-500">Po wygenerowaniu pełny kod pojawi się tutaj tylko raz.</p>}
                </div>
            </section>

            <section className="space-y-3">
                <h2 className="text-2xl font-black">Historia kodów</h2>
                {codes.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-500">Nie wygenerowano jeszcze żadnego kodu.</div> : codes.map((code) => (
                    <article key={code.id} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-5 lg:flex-row lg:items-center">
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2"><strong className="font-mono text-cyan-300">{code.code || code.codePreview}</strong><span className="rounded-full bg-white/5 px-2 py-1 text-xs font-black">{statusLabels[code.status]}</span></div>
                            <p className="mt-2 font-bold">{code.courseTitle}</p>
                            <p className="mt-1 text-xs text-slate-500">{code.accessType === "UNLIMITED" ? "Dostęp bezterminowy" : "Dostęp na 30 dni"} · kod ważny do {new Date(code.expiresAt).toLocaleString("pl-PL")}</p>
                            {code.redeemedByEmail && <p className="mt-1 text-xs text-emerald-300">Wykorzystał: {code.redeemedByEmail}</p>}
                        </div>
                        {code.status === "ACTIVE" && <button type="button" disabled={busy} onClick={() => revoke(code.id)} className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-black text-red-200"><BsTrash /> Unieważnij</button>}
                    </article>
                ))}
            </section>
        </div>
    );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsCheckCircleFill, BsKey } from "react-icons/bs";
import { apiFetch } from "../api/api";

export default function RedeemAccessCodePage() {
    const navigate = useNavigate();
    const [code, setCode] = useState("");
    const [result, setResult] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const redeem = async (event) => {
        event.preventDefault();
        try {
            setBusy(true);
            setError("");
            const data = await apiFetch("/access-codes/redeem", {
                method: "POST",
                body: JSON.stringify({ code })
            });
            setResult(data);
        } catch (e) {
            setError(e.message || "Nie udało się wykorzystać kodu.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="mx-auto max-w-2xl py-8 text-white">
            <section className="rounded-[36px] border border-cyan-400/20 bg-gradient-to-br from-slate-950 via-blue-950 to-violet-950 p-7 sm:p-10">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-cyan-400/15 text-3xl text-cyan-300"><BsKey /></div>
                <h1 className="mt-6 text-4xl font-black">Wykorzystaj kod</h1>
                <p className="mt-3 leading-7 text-slate-400">Wpisz jednorazowy kod otrzymany od administratora. Kod nie może zostać użyty przez drugą osobę.</p>

                {error && <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">{error}</div>}

                {result ? <div className="mt-7 rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6">
                    <div className="flex items-center gap-3 text-xl font-black text-emerald-200"><BsCheckCircleFill /> Kurs odblokowany</div>
                    <h2 className="mt-4 text-2xl font-black">{result.courseTitle}</h2>
                    <p className="mt-2 text-sm text-emerald-100/70">{result.unlimited ? "Dostęp bezterminowy" : `Dostęp do ${new Date(result.accessUntil).toLocaleString("pl-PL")}`}</p>
                    <button type="button" onClick={() => navigate(`/modules/${result.courseId}`)} className="mt-5 rounded-2xl bg-emerald-400 px-5 py-3 font-black text-emerald-950">Przejdź do kursu</button>
                </div> : <form onSubmit={redeem} className="mt-8 space-y-4">
                    <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="XXXX-XXXX-XXXX" maxLength={14} autoComplete="off" className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-center font-mono text-2xl font-black tracking-[0.16em] outline-none focus:border-cyan-300" />
                    <button disabled={busy || !code.trim()} className="w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-4 font-black disabled:opacity-50">{busy ? "Sprawdzanie…" : "Odblokuj kurs"}</button>
                </form>}
            </section>
        </div>
    );
}

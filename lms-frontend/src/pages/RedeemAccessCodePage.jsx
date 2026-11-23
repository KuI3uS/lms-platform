import { useLocale } from "../context/LocaleContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsCheckCircleFill } from "react-icons/bs";
import WorkspacePageHeader from "../components/WorkspacePageHeader";
import { apiFetch } from "../api/api";

export default function RedeemAccessCodePage() {
    const { t, dateLocale } = useLocale();
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
            setError(e.message || t("Nie udało się wykorzystać kodu."));
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="product-page">
            <WorkspacePageHeader title={t("Kod dostępu")} description={t("Aktywuj otrzymany kod i przejdź prosto do nauki.")} />
            <section className="product-panel max-w-xl p-6 sm:p-8">
                <h2 className="text-xl font-semibold">{t("Wykorzystaj kod")}</h2>
                <p className="mt-3 text-base leading-7 text-slate-600">{t("Wpisz jednorazowy kod otrzymany od administratora. Kod nie może zostać użyty przez drugą osobę.")}</p>
                {error && <div role="alert" className="product-error mt-6">{t(error)}</div>}
                {result ? <div role="status" className="mt-7 rounded-lg border border-emerald-200 bg-emerald-50 p-6">
                    <p className="flex items-center gap-2 font-semibold text-emerald-800"><BsCheckCircleFill aria-hidden="true" />{t("Kurs odblokowany")}</p>
                    <h3 className="mt-4 text-xl font-semibold">{result.courseTitle}</h3>
                    <p className="mt-2 text-sm text-emerald-800">{result.unlimited ? t("Dostęp bezterminowy") : t("Dostęp do {value1}", { value1: new Date(result.accessUntil).toLocaleString(dateLocale) })}</p>
                    <button type="button" onClick={() => navigate(`/modules/${result.courseId}`)} className="product-button product-button-primary mt-5">{t("Przejdź do kursu")}</button>
                </div> : <form onSubmit={redeem} className="mt-7 space-y-4">
                    <label htmlFor="course-access-code" className="block text-sm font-medium">{t("Kod dostępu")}</label>
                    <input id="course-access-code" value={code} onChange={event => setCode(event.target.value.toUpperCase())} placeholder={t("XXXX-XXXX-XXXX")} maxLength={14} autoComplete="off" spellCheck={false} className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-center font-mono text-xl tracking-wider text-slate-900 placeholder:text-slate-400" />
                    <button disabled={busy || !code.trim()} className="product-button product-button-primary w-full">{busy ? t("Sprawdzanie…") : t("Odblokuj kurs")}</button>
                </form>}
            </section>
        </div>
    );
}

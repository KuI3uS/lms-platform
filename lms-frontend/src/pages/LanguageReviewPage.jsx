import { useLocale } from "../context/LocaleContext.jsx";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsCheckCircle, BsClockHistory } from "react-icons/bs";
import WorkspacePageHeader from "../components/WorkspacePageHeader";
import { apiFetch } from "../api/api";
import PronunciationTrainer from "../components/PronunciationTrainer";

export default function LanguageReviewPage() {
    const { t } = useLocale();
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        apiFetch("/language-reviews/due")
            .then((data) => setReviews(data || []))
            .catch((loadError) => setError(loadError.message || "Nie udało się pobrać powtórek."))
            .finally(() => setLoading(false));
    }, []);

    const complete = (blockId, result) => {
        if (result?.lastScore >= 70) {
            setReviews((current) => current.filter((review) => review.blockId !== blockId));
        }
    };

    if (loading) return <div className="grid min-h-[50vh] place-items-center text-slate-600">{t("Układam dzisiejsze powtórki…")}</div>;

    return (
        <div className="product-page space-y-7">
            <WorkspacePageHeader title={t("Powtórki językowe")} description={t("Dobrze opanowane zwroty pojawiają się coraz rzadziej. Te trudne wracają szybciej, aż wynik się poprawi.")} />

            {error && <div role="alert" className="rounded-lg border border-red-400/20 bg-red-500/10 p-4 text-red-800">{error}</div>}
            {!error && reviews.length === 0 && (
                <section className="rounded-xl border border-emerald-400/20 bg-emerald-500/[0.07] p-10 text-center"><BsCheckCircle className="mx-auto text-3xl text-emerald-700" /><h2 className="mt-4 text-2xl font-semibold">{t("Wszystko powtórzone")}</h2><p className="mt-2 text-slate-500">{t("Następne zwroty pojawią się tu w odpowiednim momencie.")}</p></section>
            )}
            <div className="space-y-5">
                {reviews.map((review) => (
                    <article key={review.blockId} className="rounded-xl border border-slate-200 bg-white p-5 sm:p-7">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"><BsClockHistory /> {review.lessonTitle}</p>
                        <h2 className="mt-2 text-2xl font-semibold">{review.title}</h2>
                        <p className="my-5 rounded-lg bg-slate-100 p-5 text-xl font-semibold">{review.phrase}</p>
                        {review.blockType === "AUDIO" ? (
                            <div className="rounded-xl bg-slate-950 p-4 text-white"><PronunciationTrainer compact blockId={review.blockId} phrase={review.phrase} language={review.language} audioUrl={review.audioUrl} onReviewed={(result) => complete(review.blockId, result)} /></div>
                        ) : (
                            <button type="button" onClick={() => navigate(`/lesson/${review.lessonId}`)} className="product-button product-button-primary">{t("Wróć do ćwiczenia")}</button>
                        )}
                    </article>
                ))}
            </div>
        </div>
    );
}

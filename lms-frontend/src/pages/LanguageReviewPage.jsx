import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BsArrowRepeat, BsCheckCircle, BsClockHistory } from "react-icons/bs";
import { apiFetch } from "../api/api";
import PronunciationTrainer from "../components/PronunciationTrainer";

export default function LanguageReviewPage() {
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

    if (loading) return <div className="grid min-h-[50vh] place-items-center text-cyan-300">Układam dzisiejsze powtórki…</div>;

    return (
        <div className="mx-auto max-w-5xl space-y-7">
            <header className="rounded-[36px] border border-violet-400/20 bg-gradient-to-br from-violet-500/15 via-slate-900 to-cyan-500/10 p-7 sm:p-10">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-violet-300"><BsArrowRepeat /> Inteligentne powtórki</p>
                <h1 className="mt-3 text-4xl font-black sm:text-5xl">Wróć do zwrotów, zanim je zapomnisz</h1>
                <p className="mt-4 max-w-2xl leading-7 text-slate-400">Dobrze opanowane zwroty pojawiają się coraz rzadziej. Te trudne wracają szybciej, aż wynik się poprawi.</p>
            </header>

            {error && <div role="alert" className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-red-200">{error}</div>}
            {!error && reviews.length === 0 && (
                <section className="rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.07] p-10 text-center"><BsCheckCircle className="mx-auto text-5xl text-emerald-300" /><h2 className="mt-4 text-2xl font-black">Wszystko powtórzone</h2><p className="mt-2 text-slate-500">Następne zwroty pojawią się tu w odpowiednim momencie.</p></section>
            )}
            <div className="space-y-5">
                {reviews.map((review) => (
                    <article key={review.blockId} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-7">
                        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500"><BsClockHistory /> {review.lessonTitle}</p>
                        <h2 className="mt-2 text-2xl font-black">{review.title}</h2>
                        <p className="my-5 rounded-2xl bg-black/20 p-5 text-xl font-black">{review.phrase}</p>
                        {review.blockType === "AUDIO" ? (
                            <PronunciationTrainer compact blockId={review.blockId} phrase={review.phrase} language={review.language} audioUrl={review.audioUrl} onReviewed={(result) => complete(review.blockId, result)} />
                        ) : (
                            <button type="button" onClick={() => navigate(`/lesson/${review.lessonId}`)} className="rounded-xl bg-violet-600 px-5 py-3 font-black text-white hover:bg-violet-500">
                                Wróć do ćwiczenia
                            </button>
                        )}
                    </article>
                ))}
            </div>
        </div>
    );
}

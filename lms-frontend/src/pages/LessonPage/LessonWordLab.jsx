import { useMemo, useState } from "react";
import { BsArrowRepeat, BsCheckCircleFill, BsStars, BsXCircleFill } from "react-icons/bs";
import PronunciationTrainer from "../../components/PronunciationTrainer";
import { languageAnswerScore, parseVocabularyContent } from "../../utils/languageInteractiveBlocks";

export default function LessonWordLab({ block, onComplete }) {
    const config = useMemo(() => parseVocabularyContent(block.content), [block.content]);
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState("meaning");
    const [answer, setAnswer] = useState("");
    const [meaningResult, setMeaningResult] = useState(null);
    const [pronunciation, setPronunciation] = useState(null);
    const [mastered, setMastered] = useState(0);
    const [finished, setFinished] = useState(false);
    const item = config.items[index];

    const checkMeaning = () => {
        if (!answer.trim() || !item) return;
        const score = languageAnswerScore([item.translation, ...(item.acceptedAnswers || [])], answer);
        setMeaningResult({ score, accepted: score >= 82 });
        if (score >= 82) setPhase("pronunciation");
    };

    const handlePronunciation = (_review, score) => setPronunciation(score);

    const next = () => {
        if (pronunciation < 65) return;
        const nextMastered = mastered + 1;
        if (index + 1 >= config.items.length) {
            setMastered(nextMastered);
            setFinished(true);
            if (!block.correct) onComplete?.(block.id, { completedItems: nextMastered, score: 100 });
            return;
        }
        setMastered(nextMastered);
        setIndex((value) => value + 1);
        setPhase("meaning");
        setAnswer("");
        setMeaningResult(null);
        setPronunciation(null);
    };

    const restart = () => {
        setIndex(0);
        setPhase("meaning");
        setAnswer("");
        setMeaningResult(null);
        setPronunciation(null);
        setMastered(0);
        setFinished(false);
    };

    if (!item) return <section className="rounded-3xl border border-dashed border-white/10 p-8 text-center text-slate-500">Laboratorium nie ma jeszcze słów.</section>;

    return (
        <section className="overflow-hidden rounded-3xl border border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-500/[0.08] via-gray-900 to-gray-950">
            <header className="border-b border-white/10 p-5 sm:p-8">
                <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-fuchsia-300"><BsStars /> Laboratorium słów</p>
                <h2 className="mt-3 text-2xl font-black sm:text-3xl">{block.title}</h2>
                {block.description && <p className="mt-3 max-w-3xl leading-7 text-slate-400">{block.description}</p>}
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-black/40"><div className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-cyan-400 transition-all" style={{ width: `${(mastered / config.items.length) * 100}%` }} /></div>
                <p className="mt-2 text-sm font-bold text-slate-400">Opanowane: {mastered}/{config.items.length}</p>
            </header>

            <div className="p-5 sm:p-8">
                {!finished ? (
                    <div className="mx-auto max-w-2xl space-y-5">
                        <div className="rounded-3xl border border-white/10 bg-black/20 p-6 text-center sm:p-8">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Etap 1 · przypomnij znaczenie</p>
                            <h3 className="mt-4 text-4xl font-black text-white">{item.term}</h3>
                            {item.example && <p className="mt-3 italic text-slate-400">{item.example}</p>}
                            <input value={answer} onChange={(event) => setAnswer(event.target.value)} onKeyDown={(event) => event.key === "Enter" && checkMeaning()} disabled={phase !== "meaning"} placeholder="Wpisz polskie znaczenie…" className="mt-6 w-full rounded-2xl border border-white/10 bg-slate-950 px-5 py-4 text-lg font-bold text-white outline-none focus:border-fuchsia-300/50 disabled:opacity-60" />
                            {phase === "meaning" && <button type="button" onClick={checkMeaning} disabled={!answer.trim()} className="mt-4 w-full rounded-2xl bg-fuchsia-600 px-5 py-4 font-black text-white disabled:opacity-40">Sprawdź znaczenie</button>}
                            {meaningResult && <div className={`mt-4 rounded-2xl border p-4 text-left ${meaningResult.accepted ? "border-emerald-400/25 bg-emerald-500/10" : "border-amber-400/25 bg-amber-500/10"}`}><p className={`flex items-center gap-2 font-black ${meaningResult.accepted ? "text-emerald-300" : "text-amber-200"}`}>{meaningResult.accepted ? <BsCheckCircleFill /> : <BsXCircleFill />}{meaningResult.accepted ? "Znaczenie opanowane" : "Spróbuj jeszcze raz"}</p>{!meaningResult.accepted && <p className="mt-2 text-sm text-slate-300">Podpowiedź: odpowiedź zaczyna się na „{item.translation.slice(0, 1)}” i ma {item.translation.length} znaków.</p>}</div>}
                        </div>

                        {phase === "pronunciation" && (
                            <div>
                                <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-fuchsia-300">Etap 2 · posłuchaj i powiedz</p>
                                <PronunciationTrainer key={`${index}-${item.term}`} phrase={item.term} language={block.language || "en-GB"} compact onReviewed={handlePronunciation} />
                                <button type="button" onClick={next} disabled={pronunciation === null || pronunciation < 65} className="mt-4 w-full rounded-2xl bg-cyan-500 px-5 py-4 font-black text-cyan-950 disabled:cursor-not-allowed disabled:opacity-40">{pronunciation !== null && pronunciation < 65 ? "Powtórz wymowę, aby przejść dalej" : index + 1 === config.items.length ? "Zakończ laboratorium" : "Następne słowo"}</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="mx-auto max-w-xl rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.07] p-8 text-center"><BsCheckCircleFill className="mx-auto text-5xl text-emerald-300" /><h3 className="mt-4 text-2xl font-black">Słowa naprawdę przećwiczone</h3><p className="mt-2 text-slate-400">Rozpoznałeś znaczenie i wymówiłeś każde z {mastered} słów.</p><button type="button" onClick={restart} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-fuchsia-600 px-5 py-3 font-black text-white"><BsArrowRepeat /> Ćwicz ponownie</button></div>
                )}
            </div>
        </section>
    );
}

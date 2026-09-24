import { useEffect, useMemo, useRef, useState } from "react";
import { BsArrowRepeat, BsCheckCircleFill, BsPlayFill, BsTranslate, BsXCircleFill } from "react-icons/bs";
import {
    languageAnswerScore,
    parseVocabularyContent
} from "../../utils/languageInteractiveBlocks";

function speakWithBrowser(text, language) {
    if (!text || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language || "en-GB";
    utterance.rate = 0.86;
    window.speechSynthesis.speak(utterance);
}

export default function LessonVocabulary({ block, onComplete }) {
    const config = useMemo(() => parseVocabularyContent(block.content), [block.content]);
    const [mode, setMode] = useState("learn");
    const [index, setIndex] = useState(0);
    const [answer, setAnswer] = useState("");
    const [result, setResult] = useState(null);
    const [score, setScore] = useState({ correct: 0, completed: 0 });
    const audioRef = useRef(null);
    const objectUrlRef = useRef("");
    const item = config.items[index];

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = "";
        }
    };

    const speakWord = async (wordIndex) => {
        const word = config.items[wordIndex];
        if (!word) return;
        stopAudio();
        try {
            const response = await fetch(`/api/lesson-blocks/${block.id}/vocabulary-audio/${wordIndex}`, {
                credentials: "include",
                headers: { Accept: "audio/mpeg" }
            });
            if (!response.ok) throw new Error(`natural-audio-${response.status}`);
            objectUrlRef.current = URL.createObjectURL(await response.blob());
            const audio = new Audio(objectUrlRef.current);
            audioRef.current = audio;
            audio.onended = stopAudio;
            audio.onerror = () => {
                stopAudio();
                speakWithBrowser(word.term, block.language);
            };
            await audio.play();
        } catch {
            stopAudio();
            speakWithBrowser(word.term, block.language);
        }
    };

    useEffect(() => () => stopAudio(), []);

    const startPractice = () => {
        setMode("practice");
        setIndex(0);
        setAnswer("");
        setResult(null);
        setScore({ correct: 0, completed: 0 });
    };

    const check = () => {
        if (!item || !answer.trim() || result) return;
        const answerScore = languageAnswerScore(
            [item.translation, ...(item.acceptedAnswers || [])],
            answer
        );
        const accepted = answerScore >= 82;
        setResult({ score: answerScore, accepted });
        setScore((previous) => ({
            correct: previous.correct + (accepted ? 1 : 0),
            completed: previous.completed + 1
        }));
    };

    const next = () => {
        if (index + 1 >= config.items.length) {
            setMode("finished");
            if (!block.correct) {
                onComplete?.(block.id, {
                    completedItems: score.completed,
                    score: score.completed > 0
                        ? Math.round((score.correct / score.completed) * 100)
                        : 0
                });
            }
            return;
        }
        setIndex((previous) => previous + 1);
        setAnswer("");
        setResult(null);
    };

    return (
        <section className="overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/[0.08] via-gray-900 to-gray-950">
            <div className="border-b border-white/10 p-5 sm:p-8">
                <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-emerald-300"><BsTranslate /> Trening słówek</p>
                <h2 className="mt-3 text-2xl font-black sm:text-3xl">{block.title}</h2>
                {block.description && <p className="mt-3 max-w-3xl leading-7 text-slate-400">{block.description}</p>}
                <div className="mt-5 flex flex-wrap gap-2">
                    <button type="button" onClick={() => setMode("learn")} className={`rounded-xl px-4 py-2.5 text-sm font-black ${mode === "learn" ? "bg-emerald-400 text-emerald-950" : "border border-white/10 bg-white/5 text-slate-300"}`}>Poznaj słówka</button>
                    <button type="button" onClick={startPractice} disabled={config.items.length === 0} className={`rounded-xl px-4 py-2.5 text-sm font-black ${mode === "practice" ? "bg-blue-600 text-white" : "border border-white/10 bg-white/5 text-slate-300"}`}>Ćwicz pisanie</button>
                </div>
            </div>

            <div className="p-5 sm:p-8">
                {mode === "learn" && (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {config.items.map((word, wordIndex) => (
                            <article key={`${wordIndex}-${word.term}`} className="rounded-2xl border border-white/10 bg-black/20 p-5">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xl font-black text-white">{word.term}</p>
                                        <p className="mt-1 font-bold text-emerald-300">{word.translation}</p>
                                    </div>
                                    <button type="button" onClick={() => speakWord(wordIndex)} aria-label={`Odsłuchaj ${word.term}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"><BsPlayFill /></button>
                                </div>
                                {word.example && <p className="mt-4 border-t border-white/5 pt-4 text-sm italic leading-6 text-slate-400">{word.example}</p>}
                            </article>
                        ))}
                        {config.items.length === 0 && <p className="col-span-full rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-500">Ten trening nie ma jeszcze słówek.</p>}
                    </div>
                )}

                {mode === "practice" && item && (
                    <div className="mx-auto max-w-2xl">
                        <div className="mb-4 flex items-center justify-between text-sm font-bold text-slate-400"><span>Słówko {index + 1} z {config.items.length}</span><span>{Math.round(((index + (result ? 1 : 0)) / config.items.length) * 100)}%</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all" style={{ width: `${((index + (result ? 1 : 0)) / config.items.length) * 100}%` }} /></div>
                        <div className="mt-7 rounded-3xl border border-white/10 bg-black/20 p-6 text-center sm:p-8">
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Wpisz polskie znaczenie</p>
                            <div className="mt-4 flex items-center justify-center gap-3"><h3 className="text-3xl font-black text-white sm:text-4xl">{item.term}</h3><button type="button" onClick={() => speakWord(index)} className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300"><BsPlayFill /></button></div>
                            {item.example && <p className="mt-3 text-sm italic text-slate-500">{item.example}</p>}

                            <input value={answer} onChange={(event) => setAnswer(event.target.value)} onKeyDown={(event) => event.key === "Enter" && (result ? next() : check())} disabled={Boolean(result)} autoFocus placeholder="Twoja odpowiedź…" className="mt-7 w-full rounded-2xl border border-white/10 bg-slate-950 px-5 py-4 text-lg font-bold text-white outline-none focus:border-emerald-300/50 disabled:opacity-70" />

                            {!result ? (
                                <button type="button" onClick={check} disabled={!answer.trim()} className="mt-4 w-full rounded-2xl bg-emerald-500 px-5 py-4 font-black text-emerald-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40">Sprawdź odpowiedź</button>
                            ) : (
                                <div className="mt-5 text-left">
                                    <div className={`rounded-2xl border p-4 ${result.accepted ? "border-emerald-400/25 bg-emerald-500/10" : "border-amber-400/25 bg-amber-500/10"}`}>
                                        <p className={`flex items-center gap-2 font-black ${result.accepted ? "text-emerald-300" : "text-amber-200"}`}>{result.accepted ? <BsCheckCircleFill /> : <BsXCircleFill />}{result.accepted ? "Dobrze!" : "Zobacz poprawne znaczenie"}</p>
                                        <p className="mt-2 text-sm leading-6 text-slate-300">Poprawna odpowiedź: <strong className="text-white">{item.translation}</strong></p>
                                        {!result.accepted && <p className="mt-1 text-sm text-slate-400">To nie blokuje ćwiczenia — zapamiętaj korektę i przejdź dalej.</p>}
                                    </div>
                                    <button type="button" onClick={next} className="mt-4 w-full rounded-2xl bg-blue-600 px-5 py-4 font-black text-white hover:bg-blue-500">{index + 1 === config.items.length ? "Zobacz wynik" : "Następne słówko"}</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {mode === "finished" && (
                    <div className="mx-auto max-w-xl rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.07] p-8 text-center">
                        <BsCheckCircleFill className="mx-auto text-5xl text-emerald-300" />
                        <h3 className="mt-4 text-2xl font-black">Trening ukończony</h3>
                        <p className="mt-2 text-slate-400">Poprawne odpowiedzi: <strong className="text-white">{score.correct}/{score.completed}</strong>. Błędy są częścią nauki — możesz od razu wykonać kolejną próbę.</p>
                        <button type="button" onClick={startPractice} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-black text-emerald-950 hover:bg-emerald-400"><BsArrowRepeat /> Powtórz trening</button>
                    </div>
                )}
            </div>
        </section>
    );
}

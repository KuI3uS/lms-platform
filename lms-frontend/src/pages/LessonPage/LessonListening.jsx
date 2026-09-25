import { useEffect, useMemo, useRef, useState } from "react";
import { BsCheckCircleFill, BsHeadphones, BsPlayFill, BsXCircleFill } from "react-icons/bs";
import { languageAnswerScore, parseVocabularyContent } from "../../utils/languageInteractiveBlocks";

export default function LessonListening({ block, onComplete }) {
    const config = useMemo(() => parseVocabularyContent(block.content), [block.content]);
    const [index, setIndex] = useState(0);
    const [answer, setAnswer] = useState("");
    const [result, setResult] = useState(null);
    const audioRef = useRef(null);
    const item = config.items[index];
    useEffect(() => () => audioRef.current?.pause(), []);
    const play = async () => {
        if (!item) return;
        try {
            const response = await fetch(`/api/lesson-blocks/${block.id}/vocabulary-audio/${index}`, { credentials: "include", headers: { Accept: "audio/mpeg" } });
            if (!response.ok) throw new Error();
            const audio = new Audio(URL.createObjectURL(await response.blob()));
            audioRef.current = audio;
            await audio.play();
        } catch {
            const utterance = new SpeechSynthesisUtterance(item.term);
            utterance.lang = block.language || "en-GB";
            window.speechSynthesis.speak(utterance);
        }
    };
    const check = () => {
        const score = languageAnswerScore([item.translation, ...(item.acceptedAnswers || [])], answer);
        setResult({ score, accepted: score >= 90 });
    };
    const next = () => {
        if (!result?.accepted) return;
        if (index + 1 >= config.items.length) {
            if (!block.correct) onComplete?.(block.id, { completedItems: config.items.length, score: 100 });
            return;
        }
        setIndex((value) => value + 1); setAnswer(""); setResult(null);
    };
    if (!item) return null;
    return <section className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.08] via-gray-900 to-gray-950 p-5 sm:p-8">
        <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-cyan-300"><BsHeadphones /> Rozpoznawanie ze słuchu</p><h2 className="mt-3 text-2xl font-black">{block.title}</h2>{block.description && <p className="mt-2 text-slate-400">{block.description}</p>}
        <div className="mx-auto mt-7 max-w-2xl rounded-3xl border border-white/10 bg-black/20 p-6 text-center sm:p-8"><p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Nagranie {index + 1} z {config.items.length}</p><button type="button" onClick={play} aria-label="Odtwórz nagranie" className="mx-auto mt-5 grid h-20 w-20 place-items-center rounded-full bg-cyan-500 text-3xl text-cyan-950"><BsPlayFill /></button><p className="mt-4 text-sm text-slate-500">Odpowiedź pojawi się dopiero po poprawnej próbie.</p>
        <input autoFocus value={answer} onChange={(event) => setAnswer(event.target.value)} onKeyDown={(event) => event.key === "Enter" && (result?.accepted ? next() : check())} disabled={result?.accepted} placeholder="Twoja odpowiedź…" className="mt-6 w-full rounded-2xl border border-white/10 bg-slate-950 px-5 py-4 text-lg font-bold text-white outline-none focus:border-cyan-300/50" />
        {!result?.accepted && <button type="button" onClick={check} disabled={!answer.trim()} className="mt-4 w-full rounded-2xl bg-cyan-500 px-5 py-4 font-black text-cyan-950 disabled:opacity-40">Sprawdź odpowiedź</button>}
        {result && <div className={`mt-4 rounded-2xl border p-4 text-left ${result.accepted ? "border-emerald-400/25 bg-emerald-500/10" : "border-amber-400/25 bg-amber-500/10"}`}><p className={`flex items-center gap-2 font-black ${result.accepted ? "text-emerald-300" : "text-amber-200"}`}>{result.accepted ? <BsCheckCircleFill /> : <BsXCircleFill />}{result.accepted ? `Poprawnie: ${item.translation}` : "Posłuchaj jeszcze raz i popraw odpowiedź"}</p>{!result.accepted && <p className="mt-2 text-sm text-slate-400">Podpowiedź: odpowiedź ma {item.translation.replace(/\s/g, "").length} znaków.</p>}</div>}
        {result?.accepted && <button type="button" onClick={next} className="mt-4 w-full rounded-2xl bg-emerald-500 px-5 py-4 font-black text-emerald-950">{index + 1 === config.items.length ? "Zakończ ćwiczenie" : "Następne nagranie"}</button>}</div>
    </section>;
}

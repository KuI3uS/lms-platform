import { useEffect, useMemo, useRef, useState } from "react";
import {
    BsChatDots,
    BsCheckCircleFill,
    BsHeadphones,
    BsKeyboard,
    BsMicFill,
    BsPlayFill,
    BsStopFill
} from "react-icons/bs";
import {
    languageAnswerScore,
    parseDialogContent
} from "../../utils/languageInteractiveBlocks";
import useDialogSpeech from "./useDialogSpeech";

function DialogueBubble({ character, text, onSpeak, active = false, muted = false, children }) {
    const right = character.side === "right";
    return (
        <div className={`flex items-end gap-3 ${right ? "flex-row-reverse" : ""}`}>
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-slate-950 text-2xl shadow-lg">{character.avatar}</div>
            <div className={`max-w-[82%] ${right ? "text-right" : ""}`}>
                <p className="mb-1 text-xs font-black uppercase tracking-[0.16em] text-slate-500">{character.name}</p>
                <div aria-current={active ? "step" : undefined} className={`rounded-3xl border p-4 sm:p-5 ${active ? "ring-2 ring-cyan-300 shadow-lg shadow-cyan-500/10" : ""} ${right ? "rounded-br-md border-blue-400/20 bg-blue-500/10" : "rounded-bl-md border-cyan-400/20 bg-cyan-500/10"}`}>
                    {text && <p className={`text-base font-bold leading-7 sm:text-lg ${muted ? "text-slate-500" : "text-white"}`}>{text}</p>}
                    {children}
                    {text && !muted && (
                        <button type="button" onClick={onSpeak} aria-label={`Odsłuchaj: ${character.name} — ${text}`} className="mt-3 inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-300 hover:text-cyan-200">
                            <BsPlayFill /> Odsłuchaj
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function PracticeTurn({ turn, character, coach, language, result, onResult, onSpeak, onStop }) {
    const [answer, setAnswer] = useState("");
    const [listening, setListening] = useState(false);
    const recognitionRef = useRef(null);
    useEffect(() => () => {
        const recognition = recognitionRef.current;
        if (recognition) {
            recognition.onstart = recognition.onend = recognition.onerror = recognition.onresult = null;
            recognition.abort();
        }
    }, []);
    const Recognition = useMemo(() => (
        typeof window === "undefined"
            ? null
            : window.SpeechRecognition || window.webkitSpeechRecognition || null
    ), []);

    const evaluate = (value, source) => {
        const trimmed = String(value || "").trim();
        if (!trimmed) return;
        const expectedAnswers = [turn.text, ...(turn.acceptedAnswers || [])];
        const score = languageAnswerScore(expectedAnswers, trimmed);
        onResult({ answer: trimmed, score, source, accepted: score >= 70 });
    };

    const startListening = () => {
        onStop();
        if (!Recognition) {
            onResult({
                answer: "",
                score: 0,
                source: "unsupported",
                accepted: false,
                message: "Ta przeglądarka nie obsługuje rozpoznawania mowy. Wpisz odpowiedź w polu tekstowym."
            });
            return;
        }
        const recognition = new Recognition();
        recognition.lang = language || "en-GB";
        recognition.interimResults = false;
        recognition.maxAlternatives = 3;
        recognition.continuous = false;
        recognition.onstart = () => setListening(true);
        recognition.onend = () => setListening(false);
        recognition.onerror = () => {
            setListening(false);
            onResult({
                answer: "",
                score: 0,
                source: "error",
                accepted: false,
                message: "Nie udało się rozpoznać wypowiedzi. Możesz spróbować ponownie albo wpisać odpowiedź."
            });
        };
        recognition.onresult = (event) => {
            const alternatives = Array.from(event.results?.[0] || []).map((item) => item.transcript);
            const expectedAnswers = [turn.text, ...(turn.acceptedAnswers || [])];
            const best = alternatives
                .map((transcript) => ({ transcript, score: languageAnswerScore(expectedAnswers, transcript) }))
                .sort((first, second) => second.score - first.score)[0] || { transcript: "", score: 0 };
            setAnswer(best.transcript);
            onResult({ answer: best.transcript, score: best.score, source: "voice", accepted: best.score >= 70 });
        };
        recognitionRef.current = recognition;
        recognition.start();
    };

    return (
        <DialogueBubble character={character} text={result ? turn.text : "Twoja kolej…"} onSpeak={onSpeak} muted={!result}>
            {!result && (
                <div className="mt-3 space-y-3 text-left">
                    <div className="relative">
                        <BsKeyboard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            value={answer}
                            onChange={(event) => setAnswer(event.target.value)}
                            onKeyDown={(event) => event.key === "Enter" && evaluate(answer, "text")}
                            placeholder="Wpisz swoją odpowiedź…"
                            className="w-full rounded-xl border border-white/10 bg-slate-950 py-3 pl-10 pr-3 text-white outline-none focus:border-blue-300/50"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => evaluate(answer, "text")} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white hover:bg-blue-500">Odpowiedz</button>
                        <button type="button" onClick={listening ? () => recognitionRef.current?.stop() : startListening} className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black text-white ${listening ? "bg-red-600" : "bg-violet-600 hover:bg-violet-500"}`}>
                            {listening ? <BsStopFill /> : <BsMicFill />}{listening ? "Zatrzymaj" : "Powiedz"}
                        </button>
                    </div>
                </div>
            )}
            {result && (
                <div className="mt-3 text-left">
                    <p className={`flex items-center gap-2 text-sm font-black ${result.score >= 88 ? "text-emerald-300" : result.score >= 70 ? "text-amber-300" : "text-cyan-200"}`}>
                        {result.score >= 70 && <BsCheckCircleFill />}
                        {result.score >= 88 ? "Bardzo dobrze!" : result.score >= 70 ? "Zaliczone — drobna korekta" : "Idziemy dalej — zobacz naturalną odpowiedź"}
                    </p>
                    {result.answer && <p className="mt-2 text-sm text-slate-400">Rozpoznano: <strong className="text-white">{result.answer}</strong></p>}
                    <div className="mt-3 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.06] p-3 text-sm leading-6 text-cyan-50">
                        <strong>{coach.avatar} {coach.name}:</strong>{" "}
                        {result.message || (result.score >= 88
                            ? "Brzmi naturalnie."
                            : `${turn.explanation || "W tej sytuacji najlepiej użyć wzorcowej wypowiedzi."} Wzorzec: „${turn.text}”`)}
                    </div>
                </div>
            )}
        </DialogueBubble>
    );
}

export default function LessonDialog({ block }) {
    const config = useMemo(() => parseDialogContent(block.content), [block.content]);
    const [mode, setMode] = useState("watch");
    const [results, setResults] = useState({});
    const { playback, play, stop } = useDialogSpeech(config, block.language);
    const speaking = ["starting", "playing"].includes(playback.status);
    const charactersById = new Map(config.characters.map((character) => [character.id, character]));
    const studentCharacter = charactersById.get(config.studentCharacterId) || config.characters[1];
    const coach = config.characters.find((character) => character.id !== studentCharacter.id) || config.characters[0];
    const studentTurns = config.turns.filter((turn) => turn.studentTurn || turn.speakerId === studentCharacter.id);
    const completed = studentTurns.filter((turn) => results[config.turns.indexOf(turn)]).length;

    return (
        <section className="overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.08] via-gray-900 to-gray-950">
            <div className="border-b border-white/10 p-5 sm:p-8">
                <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.2em] text-cyan-300"><BsChatDots /> Dialog interaktywny</p>
                <h2 className="mt-3 text-2xl font-black sm:text-3xl">{block.title}</h2>
                {block.description && <p className="mt-3 max-w-3xl leading-7 text-slate-400">{block.description}</p>}
                <div className="mt-5 flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => { setMode("watch"); play(); }} className={`rounded-xl px-4 py-2.5 text-sm font-black ${mode === "watch" ? "bg-cyan-500 text-slate-950" : "border border-white/10 bg-white/5 text-slate-300"}`}><BsHeadphones className="mr-2 inline" />{playback.status === "done" ? "Posłuchaj ponownie" : "Posłuchaj całej rozmowy"}</button>
                    {speaking && <button type="button" onClick={stop} className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-black text-white"><BsStopFill className="mr-2 inline" />Zatrzymaj</button>}
                    <button type="button" onClick={() => { stop(); setMode("practice"); }} className={`rounded-xl px-4 py-2.5 text-sm font-black ${mode === "practice" ? "bg-blue-600 text-white" : "border border-white/10 bg-white/5 text-slate-300"}`}><BsMicFill className="mr-2 inline" />Wciel się w: {studentCharacter.avatar} {studentCharacter.name}</button>
                </div>
                <p role="status" className="mt-3 text-sm text-cyan-100/80">
                    {speaking ? `Wypowiedź ${playback.index + 1} z ${config.turns.length}`
                        : playback.status === "blocked" ? "Przeglądarka wstrzymała dźwięk. Kliknij „Posłuchaj całej rozmowy”, aby rozpocząć."
                        : playback.status === "unsupported" ? "Ta przeglądarka nie obsługuje odczytywania tekstu. Możesz nadal przeczytać dialog i wykonać ćwiczenie."
                        : playback.status === "no-voice" ? "Na tym urządzeniu nie znaleziono odpowiedniego głosu kobiecego lub męskiego w języku lekcji. Dodaj głosy w ustawieniach mowy urządzenia. Nadal możesz przeczytać dialog i wykonać ćwiczenie."
                        : playback.status === "error" ? "Nie udało się odtworzyć dźwięku. Spróbuj ponownie."
                        : playback.status === "done" ? "Koniec odsłuchu. Możesz teraz wcielić się w swoją postać."
                        : "Kliknij „Posłuchaj całej rozmowy”, aby odtworzyć kwestie po kolei, lub odsłuchaj wybrany dymek."}
                </p>
            </div>

            <div className="space-y-5 p-5 sm:p-8">
                {mode === "practice" && studentTurns.length > 0 && (
                    <div className="rounded-2xl border border-blue-400/20 bg-blue-500/[0.07] p-4 text-sm text-blue-100">
                        <strong>Postęp scenki: {completed}/{studentTurns.length}</strong>
                        <p className="mt-1 text-blue-200/70">Możesz mówić lub pisać. Pomyłka pokaże korektę, ale nigdy nie zablokuje dalszej nauki.</p>
                    </div>
                )}

                {config.turns.map((turn, index) => {
                    const character = charactersById.get(turn.speakerId) || config.characters[index % 2];
                    const studentTurn = turn.studentTurn || turn.speakerId === studentCharacter.id;
                    if (mode === "practice" && studentTurn) {
                        return (
                            <PracticeTurn
                                key={`${index}-${turn.text}`}
                                turn={turn}
                                character={character}
                                coach={coach}
                                language={block.language}
                                result={results[index]}
                                onSpeak={() => play(index)}
                                onStop={stop}
                                onResult={(result) => setResults((previous) => ({ ...previous, [index]: result }))}
                            />
                        );
                    }
                    return <DialogueBubble key={`${index}-${turn.text}`} character={character} text={turn.text} onSpeak={() => play(index)} active={speaking && playback.index === index} />;
                })}

                {config.turns.length === 0 && <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-slate-500">Ten dialog nie ma jeszcze wypowiedzi.</p>}
            </div>
        </section>
    );
}

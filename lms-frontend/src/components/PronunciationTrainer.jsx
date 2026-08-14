import { useMemo, useRef, useState } from "react";
import {
    BsMicFill,
    BsPlayFill,
    BsSoundwave,
    BsStopFill
} from "react-icons/bs";
import { apiFetch } from "../api/api";
import { useFeedback } from "../context/FeedbackContext";

function normalize(value) {
    return (value || "")
        .toLocaleLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\p{L}\p{N}' ]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function distance(first, second) {
    const rows = Array.from({ length: second.length + 1 }, (_, index) => index);
    for (let firstIndex = 1; firstIndex <= first.length; firstIndex++) {
        let previous = rows[0];
        rows[0] = firstIndex;
        for (let secondIndex = 1; secondIndex <= second.length; secondIndex++) {
            const current = rows[secondIndex];
            rows[secondIndex] = Math.min(
                rows[secondIndex] + 1,
                rows[secondIndex - 1] + 1,
                previous + (first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1)
            );
            previous = current;
        }
    }
    return rows[second.length];
}

function pronunciationScore(target, transcript) {
    const expected = normalize(target);
    const received = normalize(transcript);
    if (!expected || !received) return 0;
    return Math.max(0, Math.round(
        (1 - distance(expected, received) / Math.max(expected.length, received.length)) * 100
    ));
}

export default function PronunciationTrainer({
                                                  blockId,
                                                  phrase,
                                                  language = "en-US",
                                                  audioUrl = "",
                                                  compact = false,
                                                  onReviewed
                                              }) {
    const { showToast } = useFeedback();
    const recognitionRef = useRef(null);
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [score, setScore] = useState(null);
    const Recognition = useMemo(() => (
        typeof window === "undefined"
            ? null
            : window.SpeechRecognition || window.webkitSpeechRecognition || null
    ), []);

    const speak = () => {
        if (!phrase || !("speechSynthesis" in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(phrase);
        utterance.lang = language || "en-US";
        utterance.rate = 0.88;
        window.speechSynthesis.speak(utterance);
    };

    const saveScore = async (nextScore) => {
        if (!blockId) return;
        try {
            const review = await apiFetch(`/language-reviews/${blockId}`, {
                method: "POST",
                body: JSON.stringify({ score: nextScore })
            });
            onReviewed?.(review);
        } catch (error) {
            showToast(error.message || "Nie udało się zapisać powtórki.", "error");
        }
    };

    const start = () => {
        if (!Recognition) {
            showToast("Ta przeglądarka nie udostępnia rozpoznawania mowy. Możesz nadal korzystać z odsłuchu.", "warning");
            return;
        }
        const recognition = new Recognition();
        recognition.lang = language || "en-US";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.continuous = false;
        recognition.onstart = () => setListening(true);
        recognition.onend = () => setListening(false);
        recognition.onerror = (event) => {
            setListening(false);
            const denied = ["not-allowed", "service-not-allowed"].includes(event.error);
            showToast(
                denied
                    ? "Włącz dostęp do mikrofonu w ustawieniach przeglądarki."
                    : "Nie udało się rozpoznać wypowiedzi. Spróbuj ponownie w cichszym miejscu.",
                "warning"
            );
        };
        recognition.onresult = (event) => {
            const spoken = event.results?.[0]?.[0]?.transcript || "";
            const nextScore = pronunciationScore(phrase, spoken);
            setTranscript(spoken);
            setScore(nextScore);
            saveScore(nextScore);
        };
        recognitionRef.current = recognition;
        recognition.start();
    };

    const stop = () => recognitionRef.current?.stop();

    return (
        <div className={`rounded-3xl border border-violet-400/20 bg-violet-500/[0.07] ${compact ? "p-4" : "p-5 sm:p-7"}`}>
            {audioUrl && (
                <audio controls preload="none" className="mb-5 w-full" src={audioUrl}>
                    Twoja przeglądarka nie obsługuje odtwarzania audio.
                </audio>
            )}

            <div className="flex flex-wrap gap-3">
                <button type="button" onClick={speak} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 font-black text-cyan-100 hover:bg-cyan-300/15">
                    <BsPlayFill /> Odsłuchaj lektora
                </button>
                <button type="button" onClick={listening ? stop : start} className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 font-black text-white ${listening ? "bg-red-600" : "bg-violet-600 hover:bg-violet-500"}`}>
                    {listening ? <BsStopFill /> : <BsMicFill />}
                    {listening ? "Zatrzymaj" : "Powiedz na głos"}
                </button>
            </div>

            {listening && (
                <p className="mt-4 flex items-center gap-2 text-sm font-bold text-violet-200"><BsSoundwave className="animate-pulse" /> Słucham…</p>
            )}
            {score !== null && (
                <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between gap-4">
                        <p className="text-sm text-slate-400">Rozpoznano: <strong className="text-white">{transcript}</strong></p>
                        <span className={`shrink-0 text-2xl font-black ${score >= 90 ? "text-emerald-300" : score >= 70 ? "text-amber-300" : "text-red-300"}`}>{score}%</span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/40"><div className={`h-full rounded-full ${score >= 90 ? "bg-emerald-400" : score >= 70 ? "bg-amber-400" : "bg-red-400"}`} style={{ width: `${score}%` }} /></div>
                    <p className="mt-3 text-xs leading-5 text-slate-500">Ocena porównuje rozpoznane słowa ze wzorcem. Nie zastępuje oceny akcentu przez nauczyciela.</p>
                </div>
            )}
        </div>
    );
}

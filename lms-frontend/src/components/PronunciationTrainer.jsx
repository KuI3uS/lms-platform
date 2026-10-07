import { useEffect, useMemo, useRef, useState } from "react";
import {
    BsMicFill,
    BsPlayFill,
    BsSoundwave,
    BsStopFill
} from "react-icons/bs";
import { englishLetter, letterPronunciation, pronunciationScore, recognitionTranscripts } from "../utils/pronunciation";
import { speakWithBrowser } from "../utils/browserSpeech";
import { apiFetch } from "../api/api";
import { useFeedback } from "../context/FeedbackContext";

function recordingLimit(phrase) {
    const units = (phrase || "").trim().split(/\s+/).filter(Boolean).length;
    return Math.min(20000, Math.max(7000, 3500 + units * 1100));
}

export default function PronunciationTrainer({
                                                  blockId,
                                                  phrase,
                                                  language = "en-US",
                                                  audioUrl = "",
                                                  compact = false,
                                                  onReviewed
                                              }) {
    const speechLanguage = language || "en-US";
    const letter = englishLetter(phrase, speechLanguage);
    const { showToast } = useFeedback();
    const recognitionRef = useRef(null);
    const audioRef = useRef(null);
    const silenceTimerRef = useRef(null);
    const maxTimerRef = useRef(null);
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [score, setScore] = useState(null);
    const Recognition = useMemo(() => (
        typeof window === "undefined"
            ? null
            : window.SpeechRecognition || window.webkitSpeechRecognition || null
    ), []);

    const clearRecognitionTimers = () => {
        window.clearTimeout(silenceTimerRef.current);
        window.clearTimeout(maxTimerRef.current);
        silenceTimerRef.current = null;
        maxTimerRef.current = null;
    };

    useEffect(() => () => {
        clearRecognitionTimers();
        recognitionRef.current?.abort();
        window.speechSynthesis?.cancel();
        audioRef.current?.pause();
    }, []);

    const speak = () => {
        if (listening) return;
        if (audioUrl && audioRef.current) {
            window.speechSynthesis?.cancel();
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => showToast("Nie udało się odtworzyć nagrania.", "warning"));
            return;
        }
        if (!speakWithBrowser(phrase, speechLanguage)) {
            showToast("Odsłuch nie jest dostępny w tej przeglądarce.", "warning");
        }
    };

    const saveScore = async (nextScore) => {
        if (!blockId) {
            onReviewed?.(null, nextScore);
            return;
        }
        try {
            const review = await apiFetch(`/language-reviews/${blockId}`, {
                method: "POST",
                body: JSON.stringify({ score: nextScore })
            });
            onReviewed?.(review, nextScore);
        } catch (error) {
            showToast(error.message || "Nie udało się zapisać powtórki.", "error");
        }
    };

    const start = () => {
        if (!Recognition) {
            showToast("Ta przeglądarka nie udostępnia rozpoznawania mowy. Możesz nadal korzystać z odsłuchu.", "warning");
            return;
        }
        window.speechSynthesis?.cancel();
        audioRef.current?.pause();
        const recognition = new Recognition();
        recognition.lang = speechLanguage;
        recognition.interimResults = true;
        recognition.maxAlternatives = 3;
        // Safari/Chrome potrafią uznać krótką pauzę między literami za koniec
        // wypowiedzi. Tryb ciągły pozwala zebrać wszystkie fragmenty, a własny
        // licznik ciszy kończy próbę wtedy, gdy uczeń faktycznie przestał mówić.
        recognition.continuous = true;
        recognition.onstart = () => setListening(true);
        let latestTranscript = "";
        let evaluated = false;
        const evaluateTranscript = () => {
            if (evaluated || !latestTranscript.trim()) return;
            evaluated = true;
            const nextScore = pronunciationScore(phrase, latestTranscript, speechLanguage);
            setTranscript(latestTranscript);
            setScore(nextScore);
            saveScore(nextScore);
        };
        recognition.onend = () => {
            clearRecognitionTimers();
            setListening(false);
            evaluateTranscript();
        };
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
            latestTranscript = recognitionTranscripts(event.results)
                .map((text) => ({ text, score: pronunciationScore(phrase, text, speechLanguage) }))
                .sort((first, second) => second.score - first.score)[0]?.text || "";
            window.clearTimeout(silenceTimerRef.current);
            silenceTimerRef.current = window.setTimeout(() => recognition.stop(), 1100);
        };
        recognitionRef.current = recognition;
        recognition.start();
        maxTimerRef.current = window.setTimeout(() => recognition.stop(), recordingLimit(phrase));
    };

    const stop = () => {
        clearRecognitionTimers();
        recognitionRef.current?.stop();
    };

    return (
        <div className={`rounded-3xl border border-violet-400/20 bg-violet-500/[0.07] ${compact ? "p-4" : "p-5 sm:p-7"}`}>
            {audioUrl && (
                <audio ref={audioRef} controls preload="none" className="mb-5 w-full" src={audioUrl}>
                    Twoja przeglądarka nie obsługuje odtwarzania audio.
                </audio>
            )}

            <div className="flex flex-wrap gap-3">
                <button type="button" onClick={speak} disabled={listening} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 font-black text-cyan-100 hover:bg-cyan-300/15">
                    <BsPlayFill /> Odsłuchaj lektora
                </button>
                <button type="button" onClick={listening ? stop : start} className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 font-black text-white ${listening ? "bg-red-600" : "bg-violet-600 hover:bg-violet-500"}`}>
                    {listening ? <BsStopFill /> : <BsMicFill />}
                    {listening ? "Zatrzymaj" : "Powiedz na głos"}
                </button>
            </div>

            {letter && (
                <p className="mt-4 text-sm text-slate-400">Wymowa {letter}: <strong className="text-white">/{letterPronunciation(phrase, speechLanguage)}/</strong>. Powiedz tylko nazwę litery.</p>
            )}
            {listening && (
                <p className="mt-4 flex items-center gap-2 text-sm font-bold text-violet-200"><BsSoundwave className="animate-pulse" /> Słucham… Nagranie zakończy się automatycznie po krótkiej ciszy.</p>
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

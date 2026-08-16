import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    BsArrowLeft,
    BsCheckCircleFill,
    BsClockFill,
    BsExclamationTriangle,
    BsTrophyFill
} from "react-icons/bs";
import { apiFetch } from "../api/api";

function formatTime(seconds) {
    const safe = Math.max(0, seconds);
    const minutes = Math.floor(safe / 60).toString().padStart(2, "0");
    const rest = (safe % 60).toString().padStart(2, "0");
    return `${minutes}:${rest}`;
}

export default function ExamAttemptPage() {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const [attempt, setAttempt] = useState(null);
    const [answers, setAnswers] = useState({});
    const [remaining, setRemaining] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const answersRef = useRef({});
    const tabSwitchesRef = useRef(0);
    const submittedRef = useRef(false);

    const finishExam = useCallback(async () => {
        if (submittedRef.current) return;
        submittedRef.current = true;
        setSubmitting(true);
        setError("");

        try {
            const result = await apiFetch(`/exams/${attemptId}/submit`, {
                method: "POST",
                body: JSON.stringify({
                    answers: Object.entries(answersRef.current).map(([questionId, answerId]) => ({
                        questionId: Number(questionId),
                        answerId
                    })),
                    tabSwitchCount: tabSwitchesRef.current
                })
            });
            setAttempt(result);
        } catch (submitError) {
            submittedRef.current = false;
            setError(submitError.message || "Nie udało się zakończyć egzaminu.");
        } finally {
            setSubmitting(false);
        }
    }, [attemptId]);

    useEffect(() => {
        let active = true;
        apiFetch(`/exams/${attemptId}`)
            .then((data) => {
                if (!active) return;
                setAttempt(data);
                setRemaining(Math.max(
                    0,
                    Math.floor((new Date(data.expiresAt).getTime() - Date.now()) / 1000)
                ));
                if (data.status !== "IN_PROGRESS") submittedRef.current = true;
            })
            .catch((loadError) => {
                if (active) setError(loadError.message || "Nie udało się pobrać egzaminu.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [attemptId]);

    useEffect(() => {
        if (attempt?.status !== "IN_PROGRESS") return undefined;
        const timer = window.setInterval(() => {
            const seconds = Math.max(
                0,
                Math.floor((new Date(attempt.expiresAt).getTime() - Date.now()) / 1000)
            );
            setRemaining(seconds);
            if (seconds === 0) finishExam();
        }, 1000);
        return () => window.clearInterval(timer);
    }, [attempt, finishExam]);

    useEffect(() => {
        const onVisibilityChange = () => {
            if (document.hidden && attempt?.status === "IN_PROGRESS") {
                tabSwitchesRef.current += 1;
            }
        };
        document.addEventListener("visibilitychange", onVisibilityChange);
        return () => document.removeEventListener("visibilitychange", onVisibilityChange);
    }, [attempt?.status]);

    const selectAnswer = (questionId, answerId) => {
        const next = { ...answersRef.current, [questionId]: answerId };
        answersRef.current = next;
        setAnswers(next);
    };

    if (loading) {
        return (
            <div className="flex min-h-[55vh] items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
            </div>
        );
    }

    if (!attempt) {
        return (
            <div className="mx-auto max-w-2xl rounded-3xl border border-red-500/20 bg-red-500/10 p-8 text-center text-red-200">
                {error || "Nie znaleziono egzaminu."}
            </div>
        );
    }

    if (attempt.status !== "IN_PROGRESS") {
        const expired = attempt.status === "EXPIRED";
        return (
            <div className="mx-auto max-w-3xl text-center text-white">
                <div className={`mx-auto grid h-24 w-24 place-items-center rounded-full text-4xl ${
                    attempt.passed ? "bg-emerald-500/15 text-emerald-300" : "bg-violet-500/15 text-violet-300"
                }`}>
                    {attempt.passed ? <BsTrophyFill /> : <BsCheckCircleFill />}
                </div>
                <p className="mt-8 text-sm font-black uppercase tracking-[0.3em] text-violet-300">
                    {expired ? "Czas minął" : "Egzamin zakończony"}
                </p>
                <h1 className="mt-3 text-4xl font-black sm:text-6xl">{attempt.courseTitle}</h1>
                <p className="mt-7 text-7xl font-black">{Math.round(attempt.percentage)}%</p>
                <p className="mt-3 text-lg text-slate-400">
                    {attempt.correctAnswers} z {attempt.totalQuestions} poprawnych odpowiedzi
                </p>
                {attempt.examType !== "PRACTICE" && attempt.cefrLevel && (
                    <p className={`mx-auto mt-5 max-w-xl rounded-2xl px-5 py-4 font-bold ${attempt.passed ? "bg-emerald-500/10 text-emerald-200" : "bg-amber-500/10 text-amber-200"}`}>
                        {attempt.passed
                            ? attempt.examType === "PLACEMENT"
                                ? `Poziom ${attempt.cefrLevel} został odblokowany. Możesz rozpocząć naukę od tego miejsca.`
                                : attempt.cefrLevel === "C2"
                                    ? "Egzamin C2 został zaliczony. Ukończyłeś całą ścieżkę językową."
                                    : `Egzamin poziomu ${attempt.cefrLevel} został zaliczony. Następny poziom jest już dostępny.`
                            : "Do zaliczenia egzaminu poziomu potrzeba co najmniej 80%. Możesz spróbować ponownie z nowym zestawem pytań."}
                    </p>
                )}
                <button
                    type="button"
                    onClick={() => navigate("/exams")}
                    className="mt-9 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-blue-600 px-6 py-4 font-black"
                >
                    <BsArrowLeft /> Wróć do egzaminów
                </button>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl space-y-7 text-white">
            <header className="sticky top-0 z-30 flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/90 p-5 shadow-xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-violet-300">Egzamin w toku</p>
                    <h1 className="mt-1 text-xl font-black sm:text-2xl">{attempt.courseTitle}</h1>
                </div>
                <div className={`flex items-center gap-3 rounded-2xl px-5 py-3 text-xl font-black ${
                    remaining < 300 ? "bg-red-500/15 text-red-300" : "bg-violet-500/15 text-violet-200"
                }`}>
                    <BsClockFill /> {formatTime(remaining)}
                </div>
            </header>

            {error && (
                <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
                    <BsExclamationTriangle /> {error}
                </div>
            )}

            <div className="space-y-5">
                {attempt.questions.map((question, questionIndex) => (
                    <section key={question.id} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                            Pytanie {questionIndex + 1} z {attempt.totalQuestions}
                        </p>
                        <h2 className="mt-3 text-lg font-black leading-8 sm:text-xl">{question.content}</h2>
                        <div className="mt-5 grid gap-3">
                            {question.answers.map((answer) => {
                                const checked = answers[question.id] === answer.id;
                                return (
                                    <label
                                        key={answer.id}
                                        className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition ${
                                            checked
                                                ? "border-violet-400 bg-violet-500/15"
                                                : "border-white/10 bg-black/20 hover:border-white/20"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${question.id}`}
                                            checked={checked}
                                            onChange={() => selectAnswer(question.id, answer.id)}
                                            className="mt-1 accent-violet-500"
                                        />
                                        <span className="leading-7 text-slate-200">{answer.content}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </section>
                ))}
            </div>

            <div className="sticky bottom-4 rounded-3xl border border-white/10 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-xl">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-slate-400">
                        Udzielono odpowiedzi: <strong className="text-white">{Object.keys(answers).length}/{attempt.totalQuestions}</strong>
                    </p>
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={finishExam}
                        className="rounded-2xl bg-gradient-to-r from-violet-500 to-blue-600 px-7 py-3.5 font-black disabled:opacity-60"
                    >
                        {submitting ? "Sprawdzanie..." : "Zakończ i sprawdź wynik"}
                    </button>
                </div>
            </div>
        </div>
    );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    BsArrowRight,
    BsClock,
    BsPatchQuestion,
    BsPlayFill,
    BsTrophyFill
} from "react-icons/bs";
import { apiFetch } from "../api/api";
import { getCourseCover } from "../utils/courseCover";

export default function ExamsPage() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [history, setHistory] = useState([]);
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [startingId, setStartingId] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        Promise.all([
            apiFetch("/courses/my"),
            apiFetch("/exams/history/my")
        ])
            .then(([courseData, historyData]) => {
                if (!active) return;
                setCourses(courseData || []);
                setHistory(historyData || []);
            })
            .catch((loadError) => {
                if (active) setError(loadError.message || "Nie udało się pobrać egzaminów.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    const changeSetting = (courseId, field, value) => {
        setSettings((current) => ({
            ...current,
            [courseId]: {
                questionCount: current[courseId]?.questionCount || 20,
                durationMinutes: current[courseId]?.durationMinutes || 40,
                [field]: Number(value)
            }
        }));
    };

    const startExam = async (course) => {
        try {
            setStartingId(course.id);
            setError("");
            const config = settings[course.id] || {
                questionCount: 20,
                durationMinutes: 40
            };
            const attempt = await apiFetch("/exams/start", {
                method: "POST",
                body: JSON.stringify({
                    courseId: course.id,
                    ...config
                })
            });
            navigate(`/exams/${attempt.id}`);
        } catch (startError) {
            setError(startError.message || "Nie udało się rozpocząć egzaminu.");
        } finally {
            setStartingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[55vh] items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-400 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-10 text-white">
            <section className="relative overflow-hidden rounded-[38px] border border-violet-500/20 bg-gradient-to-br from-slate-950 via-violet-950/70 to-blue-950 p-7 sm:p-11">
                <div className="absolute -right-16 -top-24 h-80 w-80 rounded-full bg-violet-500/15 blur-3xl" />
                <div className="relative max-w-4xl">
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-violet-300">Symulator egzaminu zawodowego</p>
                    <h1 className="mt-4 text-4xl font-black sm:text-6xl">Sprawdź wiedzę pod presją czasu</h1>
                    <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                        Wybierz INF.02, INF.03 lub INF.04. System losuje pytania z modułów,
                        pilnuje czasu po stronie serwera i zapisuje wynik w historii.
                    </p>
                </div>
            </section>

            {error && (
                <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
                    {error}
                </div>
            )}

            <section>
                <h2 className="text-3xl font-black">Dostępne egzaminy</h2>
                {courses.length === 0 ? (
                    <div className="mt-6 rounded-3xl border border-dashed border-white/15 p-10 text-center text-slate-400">
                        Najpierw aktywuj kurs w katalogu, aby rozpocząć jego egzamin.
                    </div>
                ) : (
                    <div className="mt-6 grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
                        {courses.map((course) => {
                            const config = settings[course.id] || {
                                questionCount: 20,
                                durationMinutes: 40
                            };
                            return (
                                <article key={course.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
                                    <img
                                        src={getCourseCover(course)}
                                        alt=""
                                        className="aspect-[16/7] w-full object-cover"
                                    />
                                    <div className="space-y-5 p-6">
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-widest text-violet-300">Egzamin próbny</p>
                                            <h3 className="mt-2 text-2xl font-black">{course.title || course.name}</h3>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <label className="rounded-2xl bg-black/20 p-3">
                                                <span className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                    <BsPatchQuestion /> Pytania
                                                </span>
                                                <select
                                                    value={config.questionCount}
                                                    onChange={(event) => changeSetting(course.id, "questionCount", event.target.value)}
                                                    className="mt-2 w-full bg-transparent font-black outline-none"
                                                >
                                                    <option className="bg-slate-900" value="10">10</option>
                                                    <option className="bg-slate-900" value="20">20</option>
                                                    <option className="bg-slate-900" value="30">30</option>
                                                    <option className="bg-slate-900" value="40">40</option>
                                                </select>
                                            </label>
                                            <label className="rounded-2xl bg-black/20 p-3">
                                                <span className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                    <BsClock /> Czas
                                                </span>
                                                <select
                                                    value={config.durationMinutes}
                                                    onChange={(event) => changeSetting(course.id, "durationMinutes", event.target.value)}
                                                    className="mt-2 w-full bg-transparent font-black outline-none"
                                                >
                                                    <option className="bg-slate-900" value="20">20 min</option>
                                                    <option className="bg-slate-900" value="40">40 min</option>
                                                    <option className="bg-slate-900" value="60">60 min</option>
                                                    <option className="bg-slate-900" value="90">90 min</option>
                                                </select>
                                            </label>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => startExam(course)}
                                            disabled={startingId === course.id}
                                            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-blue-600 px-5 py-3.5 font-black disabled:opacity-60"
                                        >
                                            {startingId === course.id
                                                ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                : <BsPlayFill />}
                                            Rozpocznij egzamin
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            <section>
                <h2 className="text-3xl font-black">Historia egzaminów</h2>
                {history.length === 0 ? (
                    <p className="mt-5 rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-slate-400">
                        Nie masz jeszcze zakończonych podejść.
                    </p>
                ) : (
                    <div className="mt-5 space-y-3">
                        {history.map((attempt) => (
                            <button
                                key={attempt.id}
                                type="button"
                                onClick={() => navigate(`/exams/${attempt.id}`)}
                                className="flex w-full flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-violet-400/40 sm:flex-row sm:items-center"
                            >
                                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${
                                    attempt.passed ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-800 text-slate-400"
                                }`}>
                                    {attempt.passed ? <BsTrophyFill /> : <BsPatchQuestion />}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate font-black">{attempt.courseTitle}</span>
                                    <span className="mt-1 block text-sm text-slate-500">
                                        {attempt.correctAnswers}/{attempt.totalQuestions} poprawnych
                                    </span>
                                </span>
                                <strong className="text-2xl">{Math.round(attempt.percentage)}%</strong>
                                <BsArrowRight className="text-slate-500" />
                            </button>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

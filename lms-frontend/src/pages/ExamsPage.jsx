import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    BsArrowRight,
    BsCheckCircleFill,
    BsClock,
    BsLockFill,
    BsPatchQuestion,
    BsPlayFill,
    BsStars,
    BsTrophyFill
} from "react-icons/bs";
import { apiFetch } from "../api/api";
import { getCourseCover } from "../utils/courseCover";

function errorMessage(error) {
    try {
        const parsed = JSON.parse(error.message);
        return parsed.detail || parsed.message || "Nie udało się rozpocząć egzaminu.";
    } catch {
        return error.message || "Nie udało się rozpocząć egzaminu.";
    }
}

function examLabel(attempt) {
    if (attempt.examType === "LEVEL_FINAL") return `Egzamin końcowy ${attempt.cefrLevel}`;
    if (attempt.examType === "PLACEMENT") return `Egzamin kwalifikacyjny ${attempt.cefrLevel}`;
    return "Egzamin próbny";
}

export default function ExamsPage() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [history, setHistory] = useState([]);
    const [languagePaths, setLanguagePaths] = useState({});
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [startingId, setStartingId] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function load() {
            try {
                const [courseData, historyData] = await Promise.all([
                    apiFetch("/courses/my"),
                    apiFetch("/exams/history/my")
                ]);
                if (!active) return;

                const list = courseData || [];
                const languageCourses = list.filter((course) => course.category === "LANGUAGE");
                const paths = await Promise.all(languageCourses.map(async (course) => [
                    course.id,
                    await apiFetch(`/language-paths/course/${course.id}`)
                ]));
                if (!active) return;

                setCourses(list);
                setHistory(historyData || []);
                setLanguagePaths(Object.fromEntries(paths));
            } catch (loadError) {
                if (active) setError(errorMessage(loadError));
            } finally {
                if (active) setLoading(false);
            }
        }

        load();
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

    const startExam = async (course, examType = "PRACTICE", cefrLevel = null) => {
        const actionId = `${course.id}-${examType}-${cefrLevel || "all"}`;
        try {
            setStartingId(actionId);
            setError("");
            const config = examType === "PRACTICE"
                ? settings[course.id] || { questionCount: 20, durationMinutes: 40 }
                : { questionCount: 20, durationMinutes: 40 };
            const attempt = await apiFetch("/exams/start", {
                method: "POST",
                body: JSON.stringify({
                    courseId: course.id,
                    ...config,
                    examType,
                    cefrLevel
                })
            });
            navigate(`/exams/${attempt.id}`);
        } catch (startError) {
            setError(errorMessage(startError));
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
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-violet-300">Centrum egzaminów</p>
                    <h1 className="mt-4 text-4xl font-black sm:text-6xl">Sprawdź wiedzę i odblokuj następny etap</h1>
                    <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
                        W kursie językowym możesz przejść poziomy po kolei albo zdać egzamin kwalifikacyjny.
                        Każde podejście otrzymuje nowy, losowy zestaw z zatwierdzonej puli pytań.
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
                        Najpierw aktywuj kurs w katalogu, aby rozpocząć egzamin.
                    </div>
                ) : (
                    <div className="mt-6 grid gap-6 xl:grid-cols-2">
                        {courses.map((course) => course.category === "LANGUAGE" ? (
                            <LanguageExamCard
                                key={course.id}
                                course={course}
                                path={languagePaths[course.id]}
                                startingId={startingId}
                                onStart={startExam}
                            />
                        ) : (
                            <PracticeExamCard
                                key={course.id}
                                course={course}
                                config={settings[course.id] || { questionCount: 20, durationMinutes: 40 }}
                                startingId={startingId}
                                onChange={changeSetting}
                                onStart={startExam}
                            />
                        ))}
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
                                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${attempt.passed ? "bg-emerald-500/15 text-emerald-300" : "bg-slate-800 text-slate-400"}`}>
                                    {attempt.passed ? <BsTrophyFill /> : <BsPatchQuestion />}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate font-black">{attempt.courseTitle}</span>
                                    <span className="mt-1 block text-sm text-slate-500">
                                        {examLabel(attempt)} · {attempt.correctAnswers}/{attempt.totalQuestions} poprawnych
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

function LanguageExamCard({ course, path, startingId, onStart }) {
    if (!path) return null;

    return (
        <article className="overflow-hidden rounded-[32px] border border-violet-400/20 bg-gradient-to-br from-violet-950/40 to-slate-950">
            <div className="flex flex-col gap-5 border-b border-white/10 p-6 sm:flex-row sm:items-center">
                <img src={getCourseCover(course)} alt="" className="h-24 w-36 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-300">Ścieżka CEFR {path.startLevel}–{path.endLevel}</p>
                    <h3 className="mt-2 text-2xl font-black">{course.title || course.name}</h3>
                    <p className="mt-2 text-sm text-slate-400">Aktualnie odblokowany poziom: <strong className="text-white">{path.unlockedLevel}</strong></p>
                </div>
            </div>

            <div className="grid gap-3 p-5 sm:p-6">
                {path.levels.map((level) => {
                    const finalId = `${course.id}-LEVEL_FINAL-${level.level}`;
                    const placementId = `${course.id}-PLACEMENT-${level.level}`;
                    return (
                        <div key={level.level} className={`rounded-2xl border p-4 ${level.unlocked ? "border-violet-400/25 bg-violet-500/[0.07]" : "border-white/10 bg-black/20"}`}>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`grid h-11 w-11 place-items-center rounded-xl font-black ${level.finalExamPassed || level.skippedByPlacement ? "bg-emerald-500 text-white" : level.unlocked ? "bg-violet-500 text-white" : "bg-slate-800 text-slate-500"}`}>
                                    {level.finalExamPassed || level.skippedByPlacement ? <BsCheckCircleFill /> : level.unlocked ? level.level : <BsLockFill />}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="font-black">Poziom {level.level}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {level.completedLessonCount}/{level.lessonCount} lekcji · {level.questionCount} pytań w puli
                                    </p>
                                </div>
                                {(level.finalExamPassed || level.skippedByPlacement) && (
                                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-300">
                                        {level.skippedByPlacement ? "Potwierdzony testem" : "Zaliczony"}
                                    </span>
                                )}
                                {level.placementExamPassed && !level.finalExamPassed && (
                                    <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-black text-cyan-200">Twój poziom startowy</span>
                                )}
                            </div>

                            {!level.finalExamPassed && !level.skippedByPlacement && (
                                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                    {level.finalExamAvailable && (
                                        <button type="button" onClick={() => onStart(course, "LEVEL_FINAL", level.level)} disabled={startingId === finalId} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-blue-600 px-4 py-3 text-sm font-black disabled:opacity-50">
                                            {startingId === finalId ? <Spinner /> : <BsPlayFill />} Egzamin końcowy {level.level}
                                        </button>
                                    )}
                                    {level.placementExamAvailable && (
                                        <button type="button" onClick={() => onStart(course, "PLACEMENT", level.level)} disabled={startingId === placementId} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-black text-cyan-200 disabled:opacity-50">
                                            {startingId === placementId ? <Spinner /> : <BsStars />} Test kwalifikacyjny do {level.level}
                                        </button>
                                    )}
                                    {level.unlocked && !level.courseworkCompleted && (
                                        <p className="flex-1 rounded-xl bg-black/20 px-4 py-3 text-xs leading-5 text-slate-400">Ukończ wszystkie lekcje {level.level}, aby odblokować egzamin końcowy.</p>
                                    )}
                                    {level.questionCount < 10 && (
                                        <p className="flex-1 rounded-xl bg-amber-500/10 px-4 py-3 text-xs leading-5 text-amber-200">Administrator musi dodać co najmniej 10 pytań dla tego poziomu.</p>
                                    )}
                                </div>
                            )}
                            {level.skippedByPlacement && (
                                <p className="mt-4 rounded-xl bg-emerald-500/10 px-4 py-3 text-xs font-bold leading-5 text-emerald-200">
                                    Ten poziom został potwierdzony wyższym wynikiem testu kwalifikacyjnego. Lekcje pozostają dostępne jako dobrowolna powtórka.
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </article>
    );
}

function PracticeExamCard({ course, config, startingId, onChange, onStart }) {
    const actionId = `${course.id}-PRACTICE-all`;
    return (
        <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
            <img src={getCourseCover(course)} alt="" className="aspect-[16/7] w-full object-cover" />
            <div className="space-y-5 p-6">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-violet-300">Egzamin próbny</p>
                    <h3 className="mt-2 text-2xl font-black">{course.title || course.name}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <ExamSelect icon={<BsPatchQuestion />} label="Pytania" value={config.questionCount} onChange={(value) => onChange(course.id, "questionCount", value)} options={[[10, "10"], [20, "20"], [30, "30"], [40, "40"]]} />
                    <ExamSelect icon={<BsClock />} label="Czas" value={config.durationMinutes} onChange={(value) => onChange(course.id, "durationMinutes", value)} options={[[20, "20 min"], [40, "40 min"], [60, "60 min"], [90, "90 min"]]} />
                </div>
                <button type="button" onClick={() => onStart(course)} disabled={startingId === actionId} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-500 to-blue-600 px-5 py-3.5 font-black disabled:opacity-60">
                    {startingId === actionId ? <Spinner /> : <BsPlayFill />} Rozpocznij egzamin
                </button>
            </div>
        </article>
    );
}

function ExamSelect({ icon, label, value, onChange, options }) {
    return (
        <label className="rounded-2xl bg-black/20 p-3">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-500">{icon} {label}</span>
            <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full bg-transparent font-black outline-none">
                {options.map(([optionValue, text]) => <option key={optionValue} className="bg-slate-900" value={optionValue}>{text}</option>)}
            </select>
        </label>
    );
}

function Spinner() {
    return <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}

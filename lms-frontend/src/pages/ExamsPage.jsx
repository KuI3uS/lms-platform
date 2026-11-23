import { useLocale } from "../context/LocaleContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    BsCheckCircleFill,
    BsClock,
    BsLockFill,
    BsPatchQuestion,
    BsPlayFill,
    BsStars,
    BsTrophyFill
} from "react-icons/bs";
import WorkspacePageHeader from "../components/WorkspacePageHeader";
import { apiFetch } from "../api/api";
import { getCourseCover } from "../utils/courseCover";
import { courseCatalogPath, courseMatchesLanguage } from "../utils/courseContentLanguage";

function errorMessage(error) {
    try {
        const parsed = JSON.parse(error.message);
        return parsed.detail || parsed.message || "Nie udało się rozpocząć egzaminu.";
    } catch {
        return error.message || "Nie udało się rozpocząć egzaminu.";
    }
}

function examLabel(attempt, t) {
    if (attempt.examType === "LEVEL_FINAL") return t("Egzamin końcowy {value1}", { value1: attempt.cefrLevel });
    if (attempt.examType === "PLACEMENT") return t("Egzamin kwalifikacyjny {value1}", { value1: attempt.cefrLevel });
    return t("Egzamin próbny");
}

export default function ExamsPage() {
    const { language } = useLocale();
    return <ExamsContent key={language} />;
}

function ExamsContent() {
    const { t, language } = useLocale();
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
                    apiFetch(courseCatalogPath("/courses/my", language)),
                    apiFetch("/exams/history/my")
                ]);
                if (!active) return;

                const list = (courseData || []).filter(course => courseMatchesLanguage(course, language));
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
    }, [language]);

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
        <div className="product-page product-exams space-y-7">
            <WorkspacePageHeader title={t("Egzaminy")} description={t("Wybierz kurs, ustaw liczbę pytań i sprawdź swoją wiedzę. Historia podejść zostaje zapisana.")} />

            {error && (
                <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-800">
                    {t(error)}
                </div>
            )}

            <section>
                <h2 className="text-2xl font-semibold">{t("Dostępne egzaminy")}</h2>
                {courses.length === 0 ? (
                    <div className="mt-6 rounded-xl border border-dashed border-slate-200 p-10 text-center text-slate-600">{t("Najpierw aktywuj kurs w katalogu, aby rozpocząć egzamin.")}</div>
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
                <h2 className="text-2xl font-semibold">{t("Historia egzaminów")}</h2>
                {history.length === 0 ? (
                    <p className="mt-5 rounded-xl border border-slate-200 bg-white p-8 text-slate-600">{t("Nie masz jeszcze zakończonych podejść.")}</p>
                ) : (
                    <div className="mt-5 space-y-3">
                        {history.map((attempt) => (
                            <button
                                key={attempt.id}
                                type="button"
                                onClick={() => navigate(`/exams/${attempt.id}`)}
                                className="flex w-full flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 text-left transition hover:border-violet-400/40 sm:flex-row sm:items-center"
                            >
                                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${attempt.passed ? "bg-emerald-500/15 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                    {attempt.passed ? <BsTrophyFill /> : <BsPatchQuestion />}
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate font-semibold">{attempt.courseTitle}</span>
                                    <span className="mt-1 block text-sm text-slate-500">
                                        {examLabel(attempt, t)} · {attempt.correctAnswers}/{attempt.totalQuestions}{" "}{t("poprawnych")}</span>
                                </span>
                                <strong className="text-2xl">{Math.round(attempt.percentage)}%</strong>
                            </button>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

function LanguageExamCard({ course, path, startingId, onStart }) {
    const { t } = useLocale();
    if (!path) return null;

    return (
        <article className="overflow-hidden rounded-xl border border-violet-400/20 bg-white">
            <div className="flex flex-col gap-5 border-b border-slate-200 p-6 sm:flex-row sm:items-center">
                <img src={getCourseCover(course)} alt="" className="h-24 w-36 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">{t("Ścieżka CEFR")}{" "}{path.startLevel}–{path.endLevel}</p>
                    <h3 className="mt-2 text-2xl font-semibold">{course.title || course.name}</h3>
                    <p className="mt-2 text-sm text-slate-600">{t("Aktualnie odblokowany poziom:")}{" "}<strong className="text-slate-900">{path.unlockedLevel}</strong></p>
                </div>
            </div>

            <div className="grid gap-3 p-5 sm:p-6">
                {path.levels.map((level) => {
                    const finalId = `${course.id}-LEVEL_FINAL-${level.level}`;
                    const placementId = `${course.id}-PLACEMENT-${level.level}`;
                    return (
                        <div key={level.level} className={`rounded-lg border p-4 ${level.unlocked ? "border-violet-400/25 bg-violet-500/[0.07]" : "border-slate-200 bg-slate-50"}`}>
                            <div className="flex flex-wrap items-center gap-3">
                                <span className={`grid h-11 w-11 place-items-center rounded-xl font-semibold ${level.finalExamPassed || level.skippedByPlacement ? "bg-emerald-700 text-white" : level.unlocked ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-500"}`}>
                                    {level.finalExamPassed || level.skippedByPlacement ? <BsCheckCircleFill /> : level.unlocked ? level.level : <BsLockFill />}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold">{t("Poziom")}{" "}{level.level}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {level.completedLessonCount}/{level.lessonCount}{" "}{t("lekcji ·")}{" "}{level.questionCount}{" "}{t("pytań w puli")}</p>
                                </div>
                                {(level.finalExamPassed || level.skippedByPlacement) && (
                                    <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-700">
                                        {level.skippedByPlacement ? t("Potwierdzony testem") : t("Zaliczony")}
                                    </span>
                                )}
                                {level.placementExamPassed && !level.finalExamPassed && (
                                    <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-teal-800">{t("Twój poziom startowy")}</span>
                                )}
                            </div>

                            {!level.finalExamPassed && !level.skippedByPlacement && (
                                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                    {level.finalExamAvailable && (
                                        <button type="button" onClick={() => onStart(course, "LEVEL_FINAL", level.level)} disabled={startingId === finalId} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-teal-700 text-white px-4 py-3 text-sm font-semibold disabled:opacity-50">
                                            {startingId === finalId ? <Spinner /> : <BsPlayFill />}{" "}{t("Egzamin końcowy")}{" "}{level.level}
                                        </button>
                                    )}
                                    {level.placementExamAvailable && (
                                        <button type="button" onClick={() => onStart(course, "PLACEMENT", level.level)} disabled={startingId === placementId} className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-teal-800 disabled:opacity-50">
                                            {startingId === placementId ? <Spinner /> : <BsStars />}{" "}{t("Test kwalifikacyjny do")}{" "}{level.level}
                                        </button>
                                    )}
                                    {level.unlocked && !level.courseworkCompleted && (
                                        <p className="flex-1 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">{t("Ukończ wszystkie lekcje")}{" "}{level.level}{t(", aby odblokować egzamin końcowy.")}</p>
                                    )}
                                    {level.questionCount < 10 && (
                                        <p className="flex-1 rounded-xl bg-amber-500/10 px-4 py-3 text-xs leading-5 text-amber-900">{t("Administrator musi dodać co najmniej 10 pytań dla tego poziomu.")}</p>
                                    )}
                                </div>
                            )}
                            {level.skippedByPlacement && (
                                <p className="mt-4 rounded-xl bg-emerald-500/10 px-4 py-3 text-xs font-bold leading-5 text-emerald-800">{t("Ten poziom został potwierdzony wyższym wynikiem testu kwalifikacyjnego. Lekcje pozostają dostępne jako dobrowolna powtórka.")}</p>
                            )}
                        </div>
                    );
                })}
            </div>
        </article>
    );
}

function PracticeExamCard({ course, config, startingId, onChange, onStart }) {
    const { t } = useLocale();
    const actionId = `${course.id}-PRACTICE-all`;
    return (
        <article className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <img src={getCourseCover(course)} alt="" className="aspect-[16/7] w-full object-cover" />
            <div className="space-y-5 p-6">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-violet-700">{t("Egzamin próbny")}</p>
                    <h3 className="mt-2 text-2xl font-semibold">{course.title || course.name}</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <ExamSelect icon={<BsPatchQuestion />} label={t("Pytania")} value={config.questionCount} onChange={(value) => onChange(course.id, "questionCount", value)} options={[[10, "10"], [20, "20"], [30, "30"], [40, "40"]]} />
                    <ExamSelect icon={<BsClock />} label={t("Czas")} value={config.durationMinutes} onChange={(value) => onChange(course.id, "durationMinutes", value)} options={[[20, t("20 min")], [40, t("40 min")], [60, t("60 min")], [90, t("90 min")]]} />
                </div>
                <button type="button" onClick={() => onStart(course)} disabled={startingId === actionId} className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 text-white px-5 py-3.5 font-semibold disabled:opacity-60">
                    {startingId === actionId ? <Spinner /> : <BsPlayFill />}{" "}{t("Rozpocznij egzamin")}</button>
            </div>
        </article>
    );
}

function ExamSelect({ icon, label, value, onChange, options }) {
    return (
        <label className="rounded-lg bg-slate-50 p-3">
            <span className="flex items-center gap-2 text-xs font-bold text-slate-500">{icon} {label}</span>
            <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 w-full bg-transparent font-semibold outline-none">
                {options.map(([optionValue, text]) => <option key={optionValue} className="bg-white" value={optionValue}>{text}</option>)}
            </select>
        </label>
    );
}

function Spinner() {
    return <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}

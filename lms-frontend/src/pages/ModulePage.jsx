import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import {
    BsCheckCircle,
    BsLockFill,
    BsPlayFill,
    BsPlusCircle,
    BsTrash,
    BsGearFill,
    BsCodeSlash,
    BsTranslate,
    BsFileText,
    BsLightbulb,
    BsInfoCircle,
    BsImage,
    BsPlayBtn,
    BsHeadphones,
    BsQuestionCircle
} from "react-icons/bs";
import {
    CEFR_LEVELS,
    getCourseCategory,
    getCourseLanguageLabel
} from "../utils/courseTaxonomy";
import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../context/FeedbackContext";
import {
    canAccessLessonStep,
    getActiveLessonStepIndex,
    isLessonStepCompleted
} from "../utils/lessonSteps";

const ROADMAP_CACHE_TTL = 60_000;
const roadmapCache = new Map();

export default function ModulePage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { confirm, showToast } = useFeedback();

    const [modules, setModules] = useState([]);
    const [course, setCourse] = useState(null);
    const [newModule, setNewModule] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [stepRoadmap, setStepRoadmap] = useState({
        lessonId: null,
        steps: [],
        error: ""
    });

    const role = user?.role || null;

    const loadRoadmap = useCallback(async () => {
        const cached = roadmapCache.get(String(courseId));
        const cacheIsFresh = cached
            && Date.now() - cached.savedAt < ROADMAP_CACHE_TTL;

        if (cacheIsFresh) {
            setCourse(cached.course);
            setModules(cached.modules);
            setLoading(false);
        } else {
            setLoading(true);
        }
        setError("");

        try {
            const roadmap = await apiFetch(
                `/modules/course/${courseId}/roadmap`
            );
            const courseData = {
                id: roadmap.id,
                name: roadmap.name,
                title: roadmap.title,
                category: roadmap.category,
                courseLanguage: roadmap.courseLanguage,
                cefrLevel: roadmap.cefrLevel,
                cefrEndLevel: roadmap.cefrEndLevel,
                unlockedCefrLevel: roadmap.unlockedCefrLevel
            };
            const moduleData = roadmap.modules || [];

            roadmapCache.set(String(courseId), {
                course: courseData,
                modules: moduleData,
                savedAt: Date.now()
            });
            setCourse(courseData);
            setModules(moduleData);
        } catch (e) {
            console.error(e);
            if (!cacheIsFresh) {
                setError(e.message || "Nie udało się pobrać ścieżki kursu.");
            }
        } finally {
            setLoading(false);
        }
    }, [courseId]);

    useEffect(() => {
        const timer = window.setTimeout(loadRoadmap, 0);
        return () => window.clearTimeout(timer);
    }, [loadRoadmap]);

    const createModule = async () => {
        if (!newModule.trim()) {
            showToast("Podaj nazwę sekcji.", "warning");
            return;
        }

        const module = await apiFetch(`/modules/course/${courseId}`, {
            method: "POST",
            body: JSON.stringify({
                name: newModule,
                lessonsLocked: true
            })
        });

        setModules(prev => [...prev, { ...module, lessons: [] }]);
        roadmapCache.delete(String(courseId));
        setNewModule("");
    };

    const deleteModule = async (id) => {
        if (!await confirm({ title: "Usuń sekcję", message: "Usunąć tę sekcję wraz z lekcjami?", confirmLabel: "Usuń sekcję" })) return;

        await apiFetch(`/modules/${id}`, {
            method: "DELETE"
        });

        setModules(prev => prev.filter(m => m.id !== id));
        roadmapCache.delete(String(courseId));
    };

    const isLanguageCourse = getCourseCategory(course) === "LANGUAGE";
    const allLessons = modules.flatMap(module => (module.lessons || []).map(lesson => ({
        ...lesson,
        moduleCefrLevel: module.cefrLevel,
        belowCurrentLanguageLevel: isLanguageCourse && isCefrBelow(
            module.cefrLevel,
            course?.unlockedCefrLevel
        )
    })));
    const currentLevelLesson = isLanguageCourse
        ? allLessons.find(lesson => (
            lesson.moduleCefrLevel === course?.unlockedCefrLevel
            && lesson.canAccess
            && !lesson.completed
        ))
        : null;
    const activeLesson = currentLevelLesson || allLessons.find(lesson => (
        lesson.canAccess
        && !lesson.completed
        && !lesson.belowCurrentLanguageLevel
    )) || null;
    const activeLessonId = activeLesson?.id ?? null;
    const completedCount = allLessons.filter(lesson => (
        lesson.completed || lesson.belowCurrentLanguageLevel
    )).length;
    const progress = allLessons.length > 0
        ? Math.round((completedCount / allLessons.length) * 100)
        : 0;

    useEffect(() => {
        if (!activeLessonId) return undefined;

        let cancelled = false;

        apiFetch(`/lesson-blocks/lesson/${activeLessonId}`)
            .then(data => {
                if (cancelled) return;
                setStepRoadmap({
                    lessonId: activeLessonId,
                    steps: [...(data || [])].sort(
                        (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
                    ),
                    error: ""
                });
            })
            .catch(requestError => {
                if (cancelled) return;
                console.error(requestError);
                setStepRoadmap({
                    lessonId: activeLessonId,
                    steps: [],
                    error: "Nie udało się pobrać kroków tej lekcji."
                });
            });

        return () => {
            cancelled = true;
        };
    }, [activeLessonId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto max-w-3xl rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center text-red-200">
                {error}
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl space-y-10 text-white">
            <header className="relative px-2 py-3 sm:px-4">
                <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <p className="mb-3 text-sm font-semibold text-blue-300">
                            {isLanguageCourse ? (
                                <span className="inline-flex items-center gap-2">
                                    <BsTranslate />
                                    {getCourseLanguageLabel(course?.courseLanguage)} · CEFR {course?.cefrLevel}{course?.cefrEndLevel !== course?.cefrLevel ? `–${course?.cefrEndLevel}` : ""}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-2">
                                    <BsCodeSlash />
                                    Ścieżka technologiczna
                                </span>
                            )}
                        </p>
                        <h1 className="text-3xl font-black sm:text-5xl">
                            {course?.title || course?.name || "Roadmap kursu"}
                        </h1>
                        <p className="mt-3 max-w-2xl text-gray-400">
                            {isLanguageCourse
                                ? "Krótka lekcja po krótkiej lekcji — aż do certyfikatu."
                                : "Jedna umiejętność naraz. Ukończ węzeł, aby odblokować następny."}
                        </p>
                    </div>

                    <div className="w-full max-w-sm lg:w-80">
                        <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-gray-500">Postęp całego kursu</span>
                            <span className="font-black text-cyan-300">{progress}%</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-gray-800/80">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-[width] duration-500"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="mt-2 text-xs text-gray-600">
                            Zaliczono {completedCount} z {allLessons.length} lekcji lub ich odpowiedników
                        </p>
                        {isLanguageCourse && (
                            <button
                                type="button"
                                onClick={() => navigate("/exams")}
                                className="mt-4 w-full rounded-xl border border-violet-400/25 bg-violet-500/10 px-4 py-2.5 text-sm font-black text-violet-200 transition hover:bg-violet-500/20"
                            >
                                Egzaminy i poziomy CEFR
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {role === "ADMIN" && (
                <section className="mx-auto flex max-w-3xl gap-3 px-2">
                    <input
                        value={newModule}
                        onChange={e => setNewModule(e.target.value)}
                        placeholder="Nazwa nowej sekcji, np. Zmienne i typy danych"
                        className="flex-1 rounded-xl border border-gray-800 bg-gray-900/70 px-4 py-3 outline-none transition focus:border-blue-500"
                    />

                    <button
                        onClick={createModule}
                        className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-semibold transition hover:bg-green-700"
                    >
                        <BsPlusCircle />
                        Dodaj
                    </button>
                </section>
            )}

            <section className="mx-auto max-w-3xl space-y-24 pb-16">
                {modules.length === 0 ? (
                    <div className="py-16 text-center text-gray-500">
                        Brak sekcji w tym kursie.
                    </div>
                ) : (
                    modules.map((module, moduleIndex) => {
                        const lessons = module.lessons || [];
                        const completedLessons = lessons.filter(lesson => lesson.completed).length;
                        const levelBelowCurrent = isLanguageCourse && isCefrBelow(
                            module.cefrLevel,
                            course?.unlockedCefrLevel
                        );
                        const moduleProgress = lessons.length
                            ? Math.round((completedLessons / lessons.length) * 100)
                            : 0;

                        return (
                            <article
                                key={module.id}
                                className="relative"
                            >
                                <header className="flex flex-col gap-4 border-t border-white/10 px-2 pt-8 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-4">
                                            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-500/15 text-base font-black text-blue-200 ring-1 ring-blue-300/20">
                                                {moduleIndex + 1}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">
                                                    {isLanguageCourse ? `CEFR ${module.cefrLevel}` : `Etap ${moduleIndex + 1}`}
                                                </p>
                                                <h2 className="mt-1 text-xl font-black sm:text-2xl">
                                                    {module.name}
                                                </h2>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {lessons.length} {lessons.length === 1 ? "lekcja" : "lekcji"} · ukończono {completedLessons}
                                                    {isLanguageCourse && !module.levelUnlocked ? " · poziom zablokowany" : ""}
                                                    {levelBelowCurrent && completedLessons < lessons.length ? " · potwierdzony testem kwalifikacyjnym" : ""}
                                                </p>
                                            </div>
                                        </div>

                                    <div className="flex items-center gap-3 self-end sm:self-auto">
                                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-800">
                                                <div
                                                    className="h-full rounded-full bg-cyan-400 transition-[width] duration-500"
                                                    style={{ width: `${moduleProgress}%` }}
                                                />
                                            </div>
                                            <span>{moduleProgress}%</span>
                                        </div>

                                        {role === "ADMIN" && (
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    aria-label={`Edytuj etap ${module.name}`}
                                                    onClick={() => navigate(`/admin/lessons/${module.id}`)}
                                                    className="grid h-9 w-9 place-items-center rounded-full bg-yellow-500/10 text-yellow-300 transition hover:bg-yellow-500 hover:text-white"
                                                >
                                                    <BsGearFill />
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label={`Usuń etap ${module.name}`}
                                                    onClick={() => deleteModule(module.id)}
                                                    className="grid h-9 w-9 place-items-center rounded-full bg-red-500/10 text-red-300 transition hover:bg-red-500 hover:text-white"
                                                >
                                                    <BsTrash />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </header>

                                <div className="pt-8">
                                    {lessons.length === 0 ? (
                                        <div className="flex flex-col items-center py-5 text-center">
                                            <div className="grid h-14 w-14 place-items-center rounded-full border-2 border-dashed border-gray-700 text-gray-600">
                                                <BsLockFill />
                                            </div>
                                            <p className="mt-3 text-sm text-gray-600">
                                                Lekcje w przygotowaniu
                                            </p>
                                        </div>
                                    ) : (
                                        <ol className="space-y-4 py-2">
                                            {lessons.map((lesson, index) => {
                                                const offsets = [0, -64, 0, 64];
                                                const offset = offsets[index % offsets.length];
                                                const current = Number(lesson.id) === Number(activeLessonId);
                                                const currentSteps = current
                                                    && Number(stepRoadmap.lessonId) === Number(lesson.id)
                                                    ? stepRoadmap.steps
                                                    : [];
                                                const stepsLoading = current
                                                    && Number(stepRoadmap.lessonId) !== Number(lesson.id);

                                                return (
                                                    <li
                                                        key={lesson.id}
                                                        className="flex flex-col items-center py-2"
                                                    >
                                                        <div
                                                            className="transition-transform duration-500 ease-out"
                                                            style={{ transform: `translateX(${offset}px)` }}
                                                        >
                                                            <button
                                                                type="button"
                                                                disabled={!lesson.canAccess}
                                                                onClick={() => lesson.canAccess && navigate(`/lesson/${lesson.id}`)}
                                                                aria-label={`Lekcja ${lesson.orderIndex ?? index + 1}: ${lesson.title}`}
                                                                className="group flex w-56 flex-col items-center text-center disabled:cursor-not-allowed"
                                                            >
                                                                {current && (
                                                                    <span className="mb-2 rounded-full bg-blue-500 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-500/25">
                                                                        Kontynuuj
                                                                    </span>
                                                                )}
                                                                <span className={`relative grid h-20 w-20 place-items-center rounded-full border-2 border-b-[7px] text-2xl font-black transition-all duration-200 motion-safe:group-hover:-translate-y-1 motion-safe:group-active:translate-y-0 ${
                                                                    lesson.completed
                                                                        ? "border-emerald-300/70 border-b-emerald-700 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                                                        : lesson.canAccess
                                                                            ? "border-blue-300/80 border-b-blue-800 bg-blue-600 text-white shadow-xl shadow-blue-500/25"
                                                                            : "border-gray-700 border-b-gray-950 bg-gray-800 text-gray-600"
                                                                }`}>
                                                                    {lesson.completed ? (
                                                                        <BsCheckCircle size={30} />
                                                                    ) : lesson.canAccess ? (
                                                                        <BsPlayFill className="ml-1" size={28} />
                                                                    ) : (
                                                                        <BsLockFill size={23} />
                                                                    )}
                                                                </span>
                                                                <span className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-gray-600">
                                                                    Lekcja {lesson.orderIndex ?? index + 1}
                                                                </span>
                                                                <span className={`mt-1 line-clamp-2 max-w-52 text-sm font-black leading-5 ${
                                                                    lesson.canAccess ? "text-gray-100" : "text-gray-600"
                                                                }`}>
                                                                    {lesson.title}
                                                                </span>
                                                            </button>
                                                        </div>

                                                        {current && (
                                                            <LessonSubsteps
                                                                lesson={lesson}
                                                                steps={currentSteps}
                                                                loading={stepsLoading}
                                                                error={stepRoadmap.error}
                                                                onOpenStep={step => navigate(
                                                                    `/lesson/${lesson.id}?step=${step.id}`
                                                                )}
                                                            />
                                                        )}
                                                    </li>
                                                );
                                            })}
                                        </ol>
                                    )}
                                </div>
                            </article>
                        );
                    })
                )}
            </section>
        </div>
    );
}

function isCefrBelow(level, currentLevel) {
    const levelIndex = CEFR_LEVELS.indexOf(level);
    const currentIndex = CEFR_LEVELS.indexOf(currentLevel);
    return levelIndex >= 0 && currentIndex >= 0 && levelIndex < currentIndex;
}

function LessonSubsteps({ lesson, steps, loading, error, onOpenStep }) {
    if (loading) {
        return (
            <div className="lesson-step-transition mt-7 flex flex-col items-center gap-3" aria-label="Ładowanie podzadań">
                <div className="h-3 w-36 animate-pulse rounded-full bg-white/10" />
                {[0, 1, 2].map(item => (
                    <div
                        key={item}
                        className="h-11 w-11 animate-pulse rounded-full bg-gray-800"
                    />
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <p className="mt-6 max-w-xs text-center text-xs text-red-300">
                {error}
            </p>
        );
    }

    if (!steps.length) return null;

    const activeIndex = getActiveLessonStepIndex(steps, false);
    const completedCount = steps.filter((_, index) => (
        isLessonStepCompleted(steps, index, false)
    )).length;
    const readyToFinish = completedCount === steps.length;
    const offsets = [-48, -18, 22, 52, 22, -18];

    return (
        <section
            className="lesson-step-transition mt-7 w-full max-w-md"
            aria-label={`Podzadania lekcji ${lesson.title}`}
        >
            <header className="mb-4 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
                    Podzadania tej lekcji
                </p>
                <p className={`mt-1 text-xs font-bold ${
                    readyToFinish ? "text-emerald-300" : "text-gray-500"
                }`}>
                    {readyToFinish
                        ? "Wszystkie kroki gotowe — zakończ lekcję"
                        : `${completedCount}/${steps.length} wykonanych kroków`}
                </p>
            </header>

            <div className="relative">
                <div
                    aria-hidden="true"
                    className="absolute bottom-6 left-1/2 top-5 w-px -translate-x-1/2 bg-gradient-to-b from-blue-500/40 via-white/10 to-transparent"
                />

                <ol className="relative space-y-1 py-1">
                    {steps.map((step, index) => {
                        const completed = isLessonStepCompleted(steps, index, false);
                        const accessible = canAccessLessonStep(steps, index);
                        const active = index === activeIndex;
                        const offset = offsets[index % offsets.length];

                        return (
                            <li
                                key={step.id}
                                className="relative flex justify-center py-1.5"
                                style={{ transform: `translateX(${offset}px)` }}
                            >
                                <button
                                    type="button"
                                    disabled={!accessible}
                                    onClick={() => accessible && onOpenStep(step)}
                                    title={`${index + 1}. ${step.title || stepTypeLabel(step.type)}`}
                                    className="group flex w-44 items-center gap-3 text-left disabled:cursor-not-allowed"
                                >
                                    <span className={`relative z-10 grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-b-4 text-sm transition-all duration-200 motion-safe:group-hover:-translate-y-0.5 ${
                                        completed
                                            ? "border-emerald-300/70 border-b-emerald-800 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                            : active
                                                ? "border-cyan-200 border-b-blue-900 bg-blue-600 text-white shadow-xl shadow-blue-500/30 ring-4 ring-blue-500/15"
                                                : accessible
                                                    ? "border-gray-600 border-b-gray-950 bg-gray-800 text-gray-300 group-hover:border-blue-400 group-hover:text-white"
                                                    : "border-gray-800 border-b-black bg-gray-900 text-gray-700"
                                    }`}>
                                        {completed
                                            ? <BsCheckCircle size={17} />
                                            : accessible
                                                ? stepIcon(step.type)
                                                : <BsLockFill size={14} />}
                                    </span>

                                    <span className="min-w-0">
                                        <span className={`block text-[9px] font-black uppercase tracking-[0.16em] ${
                                            active
                                                ? "text-cyan-300"
                                                : completed
                                                    ? "text-emerald-400/80"
                                                    : "text-gray-600"
                                        }`}>
                                            Krok {index + 1}
                                        </span>
                                        <span className={`mt-0.5 line-clamp-2 block text-[11px] font-bold leading-4 ${
                                            accessible ? "text-gray-300" : "text-gray-700"
                                        }`}>
                                            {step.title || stepTypeLabel(step.type)}
                                        </span>
                                    </span>
                                </button>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </section>
    );
}

function stepIcon(type) {
    switch (type) {
        case "TIP":
            return <BsLightbulb />;
        case "INFO":
            return <BsInfoCircle />;
        case "IMAGE":
            return <BsImage />;
        case "VIDEO":
            return <BsPlayBtn />;
        case "AUDIO":
            return <BsHeadphones />;
        case "EXAMPLE":
            return <BsCodeSlash />;
        case "TASK":
        case "QUIZ":
            return <BsQuestionCircle />;
        default:
            return <BsFileText />;
    }
}

function stepTypeLabel(type) {
    const labels = {
        TEXT: "Materiał",
        TIP: "Wskazówka",
        WARNING: "Ostrzeżenie",
        INFO: "Informacja",
        SUMMARY: "Podsumowanie",
        IMAGE: "Obraz",
        VIDEO: "Film",
        AUDIO: "Wymowa",
        EXAMPLE: "Przykład",
        TASK: "Zadanie",
        QUIZ: "Quiz"
    };

    return labels[type] || "Krok lekcji";
}

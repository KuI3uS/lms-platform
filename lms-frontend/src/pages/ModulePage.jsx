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
    BsTranslate
} from "react-icons/bs";
import {
    getCourseCategory,
    getCourseLanguageLabel
} from "../utils/courseTaxonomy";

const ROADMAP_CACHE_TTL = 60_000;
const roadmapCache = new Map();

export default function ModulePage() {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [modules, setModules] = useState([]);
    const [course, setCourse] = useState(null);
    const [newModule, setNewModule] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const token = localStorage.getItem("token");
    let role = null;

    try {
        role = token ? JSON.parse(atob(token.split(".")[1])).role : null;
    } catch {
        role = null;
    }

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
                cefrLevel: roadmap.cefrLevel
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
            alert("Podaj nazwę sekcji");
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
        if (!window.confirm("Usunąć sekcję?")) return;

        await apiFetch(`/modules/${id}`, {
            method: "DELETE"
        });

        setModules(prev => prev.filter(m => m.id !== id));
        roadmapCache.delete(String(courseId));
    };

    const allLessons = modules.flatMap(m => m.lessons || []);
    const completedCount = allLessons.filter(l => l.completed).length;
    const progress = allLessons.length > 0
        ? Math.round((completedCount / allLessons.length) * 100)
        : 0;
    const isLanguageCourse = getCourseCategory(course) === "LANGUAGE";

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
                                    {getCourseLanguageLabel(course?.courseLanguage)} · CEFR {course?.cefrLevel}
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
                            Ukończono {completedCount} z {allLessons.length} lekcji
                        </p>
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
                                                    Etap {moduleIndex + 1}
                                                </p>
                                                <h2 className="mt-1 text-xl font-black sm:text-2xl">
                                                    {module.name}
                                                </h2>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {lessons.length} {lessons.length === 1 ? "lekcja" : "lekcji"} · ukończono {completedLessons}
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
                                                const current = lesson.canAccess && !lesson.completed;

                                                return (
                                                    <li
                                                        key={lesson.id}
                                                        className="flex justify-center py-2"
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

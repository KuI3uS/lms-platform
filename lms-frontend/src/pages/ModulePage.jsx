import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import {
    BsArrowRight,
    BsCheckCircle,
    BsLockFill,
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
        <div className="max-w-6xl mx-auto text-white space-y-10">

            <section className="relative overflow-hidden bg-gradient-to-br from-blue-600/30 via-purple-600/20 to-cyan-500/10 border border-blue-500/20 rounded-3xl p-8">
                <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/20 blur-3xl rounded-full" />

                <div className="relative z-10">
                    <p className="text-blue-300 font-semibold mb-2">
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

                    <h1 className="text-4xl font-black">
                        {course?.title || course?.name || "Roadmap kursu"}
                    </h1>

                    <p className="text-gray-300 mt-3 max-w-2xl">
                        {isLanguageCourse
                            ? "Rozwijaj słownictwo, gramatykę i komunikację krok po kroku. Każdy moduł przybliża Cię do ukończenia poziomu i certyfikatu."
                            : "Ucz się krok po kroku. Każda lekcja prowadzi do kolejnego etapu, a zadania praktyczne przygotowują Cię do prawdziwych projektów."}
                    </p>

                    <div className="mt-6 bg-gray-950/60 border border-white/10 rounded-2xl p-5 max-w-xl">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">Postęp kursu</span>
                            <span className="font-bold">{progress}%</span>
                        </div>

                        <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                            <div
                                className="h-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                                style={{ width: `${progress}%` }}
                            />
                        </div>

                        <p className="text-sm text-gray-400 mt-3">
                            Ukończono {completedCount} z {allLessons.length} lekcji
                        </p>
                    </div>
                </div>
            </section>

            {role === "ADMIN" && (
                <section className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex gap-3">
                    <input
                        value={newModule}
                        onChange={e => setNewModule(e.target.value)}
                        placeholder="Nazwa nowej sekcji, np. Zmienne i typy danych"
                        className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 flex-1 outline-none focus:border-blue-500"
                    />

                    <button
                        onClick={createModule}
                        className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-xl font-semibold flex items-center gap-2"
                    >
                        <BsPlusCircle />
                        Dodaj
                    </button>
                </section>
            )}

            <section className="space-y-14">
                {modules.length === 0 ? (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-gray-400">
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
                                className="overflow-hidden rounded-[2rem] border border-white/10 bg-gray-900/70 shadow-2xl"
                            >
                                <header className="border-b border-white/10 bg-gradient-to-r from-blue-500/10 via-violet-500/10 to-cyan-500/10 p-5 sm:p-7">
                                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-blue-300/30 bg-blue-500/15 text-xl font-black text-blue-200">
                                                {moduleIndex + 1}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-300">
                                                    Etap {moduleIndex + 1}
                                                </p>
                                                <h2 className="mt-1 text-2xl font-black">
                                                    {module.name}
                                                </h2>
                                                <p className="mt-2 text-sm text-gray-400">
                                                    {lessons.length} {lessons.length === 1 ? "lekcja" : "lekcji"} · ukończono {completedLessons}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="min-w-32">
                                                <div className="mb-2 flex justify-between text-xs font-bold text-gray-400">
                                                    <span>Postęp</span>
                                                    <span>{moduleProgress}%</span>
                                                </div>
                                                <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                                                    <div
                                                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                                                        style={{ width: `${moduleProgress}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {role === "ADMIN" && (
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        aria-label={`Edytuj etap ${module.name}`}
                                                        onClick={() => navigate(`/admin/lessons/${module.id}`)}
                                                        className="rounded-xl bg-yellow-600/20 p-3 text-yellow-300 transition hover:bg-yellow-600 hover:text-white"
                                                    >
                                                        <BsGearFill />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        aria-label={`Usuń etap ${module.name}`}
                                                        onClick={() => deleteModule(module.id)}
                                                        className="rounded-xl bg-red-600/20 p-3 text-red-400 transition hover:bg-red-600 hover:text-white"
                                                    >
                                                        <BsTrash />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </header>

                                <div className="p-5 sm:p-8">
                                    {lessons.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-950/40 p-6 text-gray-500">
                                            Brak lekcji w tej sekcji.
                                        </div>
                                    ) : (
                                        <ol className="relative mx-auto max-w-4xl space-y-5">
                                            <div className="absolute bottom-7 left-7 top-7 w-1 -translate-x-1/2 rounded-full bg-gradient-to-b from-blue-500 via-violet-500 to-cyan-400 opacity-35" />

                                            {lessons.map((lesson, index) => (
                                                <li key={lesson.id} className="relative flex items-center gap-4 sm:gap-6">
                                                    <div className={`z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-4 font-black shadow-lg ${
                                                        lesson.completed
                                                            ? "border-emerald-300 bg-emerald-500 text-white"
                                                            : lesson.canAccess
                                                                ? "border-blue-300 bg-blue-600 text-white shadow-blue-500/20"
                                                                : "border-gray-700 bg-gray-800 text-gray-500"
                                                    }`}>
                                                        {lesson.completed ? (
                                                            <BsCheckCircle size={23} />
                                                        ) : lesson.canAccess ? (
                                                            index + 1
                                                        ) : (
                                                            <BsLockFill size={19} />
                                                        )}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        disabled={!lesson.canAccess}
                                                        onClick={() => lesson.canAccess && navigate(`/lesson/${lesson.id}`)}
                                                        className={`group min-w-0 flex-1 rounded-2xl border p-4 text-left transition sm:p-5 ${
                                                            lesson.canAccess
                                                                ? "border-white/10 bg-gray-950/60 hover:-translate-y-0.5 hover:border-blue-400/60 hover:bg-blue-500/[0.08]"
                                                                : "cursor-not-allowed border-white/5 bg-gray-950/30 opacity-55"
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-black uppercase tracking-[0.14em] text-gray-500">
                                                                    Lekcja {lesson.orderIndex ?? index + 1}
                                                                </p>
                                                                <h3 className="mt-1 truncate text-lg font-black text-white">
                                                                    {lesson.title}
                                                                </h3>
                                                                <p className={`mt-2 text-sm ${
                                                                    lesson.completed
                                                                        ? "text-emerald-300"
                                                                        : lesson.canAccess
                                                                            ? "text-blue-300"
                                                                            : "text-gray-500"
                                                                }`}>
                                                                    {lesson.completed
                                                                        ? "Ukończona"
                                                                        : lesson.canAccess
                                                                            ? "Gotowa do rozpoczęcia"
                                                                            : "Ukończ poprzednią lekcję, aby odblokować"}
                                                                </p>
                                                            </div>
                                                            {lesson.canAccess && (
                                                                <BsArrowRight className="shrink-0 text-gray-600 transition group-hover:translate-x-1 group-hover:text-blue-300" />
                                                            )}
                                                        </div>
                                                    </button>
                                                </li>
                                            ))}
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

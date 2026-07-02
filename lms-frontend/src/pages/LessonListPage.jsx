import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import {
    BsArrowRight,
    BsCheckCircle,
    BsLockFill,
    BsPlayFill,
    BsTrophyFill
} from "react-icons/bs";

export default function LessonListPage() {
    const { moduleId } = useParams();
    const navigate = useNavigate();

    const [lessons, setLessons] = useState([]);
    const [moduleName, setModuleName] = useState("Ścieżka nauki");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);

            try {
                const [moduleData, lessonsData] = await Promise.all([
                    apiFetch(`/modules/${moduleId}`).catch(() => null),
                    apiFetch(`/lessons/module/${moduleId}`)
                ]);

                if (moduleData?.name) {
                    setModuleName(moduleData.name);
                }

                const lessonsWithAccess = await Promise.all(
                    (lessonsData || []).map(async (lesson) => {
                        try {
                            const canAccess = await apiFetch(`/lessons/${lesson.id}/access`);
                            return { ...lesson, canAccess };
                        } catch {
                            return { ...lesson, canAccess: false };
                        }
                    })
                );

                setLessons(
                    [...lessonsWithAccess].sort(
                        (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
                    )
                );
            } catch (e) {
                console.error(e);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [moduleId]);

    const completedCount = lessons.filter(l => l.completed).length;
    const progress = lessons.length > 0
        ? Math.round((completedCount / lessons.length) * 100)
        : 0;

    const firstAvailableLesson = lessons.find(l => l.canAccess && !l.completed) || lessons.find(l => l.canAccess);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-5 rounded-2xl">
                Błąd: {error}
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white">
            <div className="max-w-6xl mx-auto space-y-10">

                <section className="relative overflow-hidden rounded-[2rem] border border-blue-500/20 bg-gradient-to-br from-blue-600/20 via-gray-900 to-purple-700/20 p-8 shadow-2xl">
                    <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />

                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                        <div>
                            <p className="text-blue-300 font-semibold mb-2">
                                Roadmapa modułu
                            </p>

                            <h1 className="text-4xl md:text-5xl font-black">
                                {moduleName}
                            </h1>

                            <p className="text-gray-300 mt-4 max-w-2xl">
                                Ucz się krok po kroku. Każda lekcja odblokowuje kolejną część ścieżki.
                            </p>
                        </div>

                        <div className="bg-gray-950/70 border border-gray-700 rounded-3xl p-5 min-w-[260px]">
                            <div className="flex justify-between mb-2">
                                <span className="text-gray-400">Postęp</span>
                                <span className="font-bold">{progress}%</span>
                            </div>

                            <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                                <div
                                    className="h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            <p className="text-sm text-gray-400 mt-3">
                                {completedCount} / {lessons.length} lekcji ukończonych
                            </p>

                            {firstAvailableLesson && (
                                <button
                                    onClick={() => navigate(`/lesson/${firstAvailableLesson.id}`)}
                                    className="mt-5 w-full bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition"
                                >
                                    Kontynuuj naukę
                                    <BsArrowRight />
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                {lessons.length === 0 ? (
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 text-gray-400">
                        Brak lekcji w tym module.
                    </div>
                ) : (
                    <section className="relative max-w-3xl mx-auto py-8">
                        <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 bg-gradient-to-b from-blue-500/60 via-purple-500/40 to-gray-800 rounded-full" />

                        <div className="space-y-10">
                            {lessons.map((lesson, index) => {
                                const completed = lesson.completed;
                                const locked = !lesson.canAccess;
                                const active = lesson.canAccess && !lesson.completed;
                                const side = index % 2 === 0 ? "md:pr-24 md:text-right" : "md:pl-24 md:ml-auto";

                                return (
                                     <div
                                        key={lesson.id}
                                        className={`relative md:w-1/2 ${side}`}
                                    >
                                        <button
                                             type="button"
                                            disabled={locked}
                                            onClick={() => {
                                                if (!locked) {
                                                    navigate(`/lesson/${lesson.id}`);
                                                }
                                            }}
                                            className={`group w-full rounded-3xl border p-6 text-left transition-all duration-300 ${
                                                completed
                                                    ? "bg-green-500/10 border-green-500/30 hover:border-green-400"
                                                    : active
                                                        ? "bg-blue-600/20 border-blue-500 shadow-xl shadow-blue-500/10 hover:scale-[1.02]"
                                                        : "bg-gray-900/80 border-gray-800 opacity-60 cursor-not-allowed"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className={`text-sm font-bold mb-2 ${
                                                        completed
                                                            ? "text-green-400"
                                                            : active
                                                                ? "text-blue-300"
                                                                : "text-gray-500"
                                                    }`}>
                                                        Lekcja {lesson.orderIndex ?? index + 1}
                                                    </p>

                                                    <h2 className="text-xl font-black text-white">
                                                        {lesson.title}
                                                    </h2>

                                                    <p className="text-sm text-gray-400 mt-2">
                                                        {completed
                                                            ? "Ukończona"
                                                            : active
                                                                ? "Dostępna teraz"
                                                                : "Zablokowana"}
                                                    </p>
                                                </div>

                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                                    completed
                                                        ? "bg-green-500/20 text-green-400"
                                                        : active
                                                            ? "bg-blue-500 text-white"
                                                            : "bg-gray-800 text-gray-500"
                                                }`}>
                                                    {completed ? (
                                                        <BsCheckCircle size={22} />
                                                    ) : active ? (
                                                        <BsPlayFill size={26} />
                                                    ) : (
                                                        <BsLockFill size={20} />
                                                    )}
                                                </div>
                                            </div>
                                        </button>

                                        <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-full -ml-5 w-10 h-10 rounded-full border-4 border-gray-950 bg-gray-800 items-center justify-center">
                                            {completed ? (
                                                <BsCheckCircle className="text-green-400" />
                                            ) : active ? (
                                                <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
                                            ) : (
                                                <BsLockFill className="text-gray-500" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="relative md:w-1/2 md:mx-auto">
                                <div className="rounded-3xl border border-yellow-500/30 bg-yellow-500/10 p-6 text-center">
                                    <div className="mx-auto mb-4 w-16 h-16 rounded-3xl bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
                                        <BsTrophyFill size={30} />
                                    </div>

                                    <h2 className="text-2xl font-black">
                                        Projekt końcowy
                                    </h2>

                                    <p className="text-gray-400 mt-2">
                                        Po ukończeniu lekcji wykonasz większy projekt praktyczny.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
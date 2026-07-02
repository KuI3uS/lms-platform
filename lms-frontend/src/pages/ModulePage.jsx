import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import {
    BsArrowRight,
    BsCheckCircle,
    BsLockFill,
    BsPlusCircle,
    BsTrash,
    BsGearFill,
    BsStars
} from "react-icons/bs";

export default function ModulePage() {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [modules, setModules] = useState([]);
    const [newModule, setNewModule] = useState("");
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("token");
    let role = null;

    try {
        role = token ? JSON.parse(atob(token.split(".")[1])).role : null;
    } catch {
        role = null;
    }

    useEffect(() => {
        loadRoadmap();
    }, [courseId]);

    const loadRoadmap = async () => {
        setLoading(true);

        try {
            const modulesData = await apiFetch(`/modules/course/${courseId}`);

            const modulesWithLessons = await Promise.all(
                (modulesData || []).map(async (module) => {
                    const lessons = await apiFetch(`/lessons/module/${module.id}`);

                    const lessonsWithAccess = await Promise.all(
                        (lessons || []).map(async (lesson) => {
                            try {
                                const canAccess = await apiFetch(`/lessons/${lesson.id}/access`);
                                return { ...lesson, canAccess };
                            } catch {
                                return { ...lesson, canAccess: false };
                            }
                        })
                    );

                    return {
                        ...module,
                        lessons: lessonsWithAccess.sort(
                            (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
                        )
                    };
                })
            );

            setModules(modulesWithLessons);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

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
        setNewModule("");
    };

    const deleteModule = async (id) => {
        if (!window.confirm("Usunąć sekcję?")) return;

        await apiFetch(`/modules/${id}`, {
            method: "DELETE"
        });

        setModules(prev => prev.filter(m => m.id !== id));
    };

    const allLessons = modules.flatMap(m => m.lessons || []);
    const completedCount = allLessons.filter(l => l.completed).length;
    const progress = allLessons.length > 0
        ? Math.round((completedCount / allLessons.length) * 100)
        : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto text-white space-y-10">

            <section className="relative overflow-hidden bg-gradient-to-br from-blue-600/30 via-purple-600/20 to-cyan-500/10 border border-blue-500/20 rounded-3xl p-8">
                <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/20 blur-3xl rounded-full" />

                <div className="relative z-10">
                    <p className="text-blue-300 font-semibold mb-2">
                        Ścieżka nauki
                    </p>

                    <h1 className="text-4xl font-black">
                        Roadmap kursu
                    </h1>

                    <p className="text-gray-300 mt-3 max-w-2xl">
                        Ucz się krok po kroku. Każda lekcja prowadzi do kolejnego etapu,
                        a zadania praktyczne przygotowują Cię do prawdziwych projektów.
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
                    modules.map((module, moduleIndex) => (
                        <div key={module.id} className="relative">

                            <div className="flex items-center justify-between gap-4 mb-6">
                                <div>
                                    <p className="text-sm text-blue-400 font-semibold">
                                        Etap {moduleIndex + 1}
                                    </p>

                                    <h2 className="text-2xl font-black">
                                        {module.name}
                                    </h2>
                                </div>

                                {role === "ADMIN" && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => navigate(`/admin/lessons/${module.id}`)}
                                            className="bg-yellow-600/20 hover:bg-yellow-600 text-yellow-300 hover:text-white px-4 py-3 rounded-xl"
                                        >
                                            <BsGearFill />
                                        </button>

                                        <button
                                            onClick={() => deleteModule(module.id)}
                                            className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-4 py-3 rounded-xl"
                                        >
                                            <BsTrash />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="relative pl-8 space-y-6">
                                <div className="absolute left-[25px] top-4 bottom-4 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-cyan-500 rounded-full opacity-40" />

                                {(module.lessons || []).length === 0 ? (
                                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-500">
                                        Brak lekcji w tej sekcji.
                                    </div>
                                ) : (
                                    module.lessons.map((lesson, index) => (
                                        <button
                                            key={lesson.id}
                                            disabled={!lesson.canAccess}
                                            onClick={() => {
                                                if (lesson.canAccess) {
                                                    navigate(`/lesson/${lesson.id}`);
                                                }
                                            }}
                                            className={`relative w-full text-left rounded-3xl border p-5 transition group ${
                                                lesson.canAccess
                                                    ? "bg-gray-900 border-gray-800 hover:border-blue-500 hover:scale-[1.01]"
                                                    : "bg-gray-900/50 border-gray-800 opacity-50 cursor-not-allowed"
                                            }`}
                                        >
                                            <div className="absolute -left-[38px] top-1/2 -translate-y-1/2">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-4 ${
                                                    lesson.completed
                                                        ? "bg-green-500 border-green-300 text-white"
                                                        : lesson.canAccess
                                                            ? "bg-blue-600 border-blue-300 text-white"
                                                            : "bg-gray-800 border-gray-700 text-gray-500"
                                                }`}>
                                                    {lesson.completed ? (
                                                        <BsCheckCircle size={24} />
                                                    ) : lesson.canAccess ? (
                                                        <BsStars size={24} />
                                                    ) : (
                                                        <BsLockFill size={22} />
                                                    )}
                                                </div>
                                            </div>

                                            <div className="ml-8 flex items-center justify-between gap-4">
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">
                                                        Lekcja {lesson.orderIndex ?? index + 1}
                                                    </p>

                                                    <h3 className="text-lg font-bold">
                                                        {lesson.title}
                                                    </h3>

                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {lesson.canAccess
                                                            ? "Kliknij, aby rozpocząć naukę"
                                                            : "Zablokowana — ukończ poprzednią lekcję"}
                                                    </p>
                                                </div>

                                                {lesson.canAccess && (
                                                    <BsArrowRight className="text-gray-500 group-hover:text-blue-400 transition shrink-0" />
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    ))
                )}
            </section>
        </div>
    );
}
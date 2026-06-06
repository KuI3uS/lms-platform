import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import { BsBook, BsArrowRight } from "react-icons/bs";

export default function LessonListPage() {
    const { moduleId } = useParams();
    const navigate = useNavigate();

    const [lessons, setLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const completedCount = lessons.filter(l => l.completed).length;
    const progress = lessons.length > 0
        ? Math.round((completedCount / lessons.length) * 100)
        : 0;

    const goNextLesson = () => {
        const currentIndex = moduleLessons.findIndex(l => l.id === Number(lessonId));
        const next = moduleLessons[currentIndex + 1];
        if (next) {
            navigate(`/lesson/${next.id}`);
        }
    };
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);

            try {
                const data = await apiFetch(`/lessons/module/${moduleId}`);

                const lessonsWithAccess = await Promise.all(
                    (data || []).map(async (lesson) => {
                        const canAccess = await apiFetch(`/lessons/${lesson.id}/access`);
                        return { ...lesson, canAccess };
                    })
                );

                setLessons(lessonsWithAccess);
            } catch (e) {
                console.error(e);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [moduleId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl">
                Błąd: {error}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 text-white">
            <div>
                <h1 className="text-3xl font-bold">Lekcje</h1>
                <p className="text-gray-400 mt-1">
                    Wybierz lekcję, aby przejść do materiału i zadań.
                </p>
            </div>

            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <p className="text-gray-400 mb-2">
                    Postęp modułu: {progress}%
                </p>

                <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                        className="bg-blue-500 h-3 rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {lessons.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-400">
                    Brak lekcji w tym module.
                </div>
            ) : (
                <div className="grid gap-4">
                    {lessons.map((lesson, index) => (
                        <button
                            key={lesson.id}
                            type="button"
                            disabled={!lesson.canAccess}
                            onClick={() => {
                                if (!lesson.canAccess) return;
                                navigate(`/lesson/${lesson.id}`);
                            }}
                            className={`bg-gray-900 border rounded-2xl p-5 text-left transition group ${
                                lesson.canAccess
                                    ? "border-gray-800 hover:border-blue-600/60 cursor-pointer"
                                    : "border-red-900/40 opacity-50 cursor-not-allowed"
                            }`}
                        >
                            <div className="flex items-center gap-4">
                                <div
                                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                                        lesson.canAccess
                                            ? "bg-blue-600/20 text-blue-400"
                                            : "bg-red-600/20 text-red-400"
                                    }`}
                                >
                                    <BsBook size={20} />
                                </div>

                                <div className="flex-1">
                                    <h2
                                        className={`text-lg font-semibold transition ${
                                            lesson.canAccess
                                                ? "group-hover:text-blue-400"
                                                : "text-gray-400"
                                        }`}
                                    >
                                        {lesson.orderIndex ?? index + 1}. {lesson.title}
                                    </h2>

                                    <p className="text-sm text-gray-500">
                                        {lesson.canAccess
                                            ? "Otwórz lekcję"
                                            : "🔒 Zablokowana — ukończ poprzednią lekcję"}
                                    </p>
                                </div>

                                {lesson.canAccess ? (
                                    <BsArrowRight className="text-gray-500 group-hover:text-blue-400 transition" />
                                ) : (
                                    <span className="text-red-400 text-xl">🔒</span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
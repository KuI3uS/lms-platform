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

    useEffect(() => {
        setLoading(true);
        setError(null);

        apiFetch(`/lessons/module/${moduleId}`)
            .then(data => setLessons(data || []))
            .catch(e => {
                console.error(e);
                setError(e.message);
            })
            .finally(() => setLoading(false));
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

            {lessons.length === 0 ? (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-400">
                    Brak lekcji w tym module.
                </div>
            ) : (
                <div className="grid gap-4">
                    {lessons.map((l, index) => (
                        <button
                            key={l.id}
                            onClick={() => navigate(`/lesson/${l.id}`)}
                            className="bg-gray-900 border border-gray-800 hover:border-blue-600/60 rounded-2xl p-5 text-left transition group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                                    <BsBook size={20} />
                                </div>

                                <div className="flex-1">
                                    <h2 className="text-lg font-semibold group-hover:text-blue-400 transition">
                                        {l.orderIndex ?? index + 1}. {l.title}
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        Otwórz lekcję
                                    </p>
                                </div>

                                <BsArrowRight className="text-gray-500 group-hover:text-blue-400 transition" />
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
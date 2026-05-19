import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import {
    BsBook,
    BsCheckCircle,
    BsXCircle,
    BsCodeSlash,
    BsLightbulb,
    BsArrowRight,
    BsImage,
    BsListCheck
} from "react-icons/bs";

export default function LessonPage() {
    const { lessonId } = useParams();
    const navigate = useNavigate();

    const [lesson, setLesson] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [answers, setAnswers] = useState({});
    const [results, setResults] = useState({});
    const [error, setError] = useState(null);
    const [moduleLessons, setModuleLessons] = useState([]);

    useEffect(() => {
        if (!lessonId) return;

        setError(null);
        setLesson(null);
        setTasks([]);
        setResults({});
        setAnswers({});

        apiFetch(`/lessons/${lessonId}`)
            .then(async (data) => {
                setLesson(data);

                if (data?.module?.id) {
                    const lessons = await apiFetch(`/lessons/module/${data.module.id}`);

                    const lessonsWithAccess = await Promise.all(
                        (lessons || []).map(async (l) => {
                            const canAccess = await apiFetch(`/lessons/${l.id}/access`);
                            return { ...l, canAccess };
                        })
                    );

                    setModuleLessons(
                        [...lessonsWithAccess].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                    );
                }
            })
            .catch(e => {
                console.error("LESSON ERROR:", e);
                setError(e.message);
            });

        apiFetch(`/tasks/lesson/${lessonId}`)
            .then(data => setTasks(
                [...(data || [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
            ))
            .catch(e => {
                console.error("TASKS ERROR:", e);
                setError(e.message);
            });
    }, [lessonId]);

    const submitAll = async () => {
        try {
            await apiFetch("/lesson-submit", {
                method: "POST",
                body: JSON.stringify({
                    lessonId: Number(lessonId),
                    lessonTitle: lesson.title,
                    answers: tasks.map(task => ({
                        taskId: task.id,
                        taskContent: task.taskContent,
                        studentAnswer: answers[task.id] || ""
                    }))
                })
            });

            await apiFetch(`/lessons/${lessonId}/complete`, {
                method: "POST"
            });

            alert("Wysłano zadania i ukończono lekcję");
        } catch (e) {
            console.error(e);
            alert("Błąd wysyłania zadań");
        }
    };

    const check = async (taskId) => {
        try {
            const res = await apiFetch(`/tasks/${taskId}/check`, {
                method: "POST",
                body: JSON.stringify({
                    answer: answers[taskId] || ""
                })
            });

            setResults(prev => ({
                ...prev,
                [taskId]: res
            }));
        } catch (e) {
            console.error(e);
            alert("Błąd sprawdzania odpowiedzi");
        }
    };

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl">
                Błąd: {error}
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8 text-white">
            <div className="max-w-4xl space-y-8">
                <div>
                    <h1 className="text-3xl font-bold">
                        {lesson.title}
                    </h1>

                    {lesson.freePreview && (
                        <p className="mt-2 text-sm text-blue-400">
                            Darmowy podgląd lekcji
                        </p>
                    )}
                </div>

                <div className="bg-gray-800 p-5 rounded-xl space-y-6">
                    {lesson.imageUrl && (
                        <div>
                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                                <BsImage />
                                <span>Grafika lekcji</span>
                            </div>

                            <img
                                src={lesson.imageUrl}
                                alt={lesson.title}
                                className="rounded-xl max-h-96 object-contain bg-gray-900 border border-gray-700"
                            />
                        </div>
                    )}

                    <div>
                        <h2 className="text-blue-400 font-semibold mb-2">
                            Wytłumaczenie
                        </h2>
                        <p className="whitespace-pre-line text-gray-300">
                            {lesson.theory || "BRAK TEORII"}
                        </p>
                    </div>

                    <div>
                        <h2 className="text-green-400 font-semibold mb-2">
                            Przykład
                        </h2>
                        <pre className="bg-gray-900 p-4 rounded-xl text-green-400 whitespace-pre-wrap font-mono border border-gray-700">
                            {lesson.example || "BRAK PRZYKŁADU"}
                        </pre>
                    </div>

                    {lesson.content && (
                        <div>
                            <h2 className="text-purple-400 font-semibold mb-2">
                                Dodatkowe materiały
                            </h2>
                            <p className="whitespace-pre-line text-gray-300">
                                {lesson.content}
                            </p>
                        </div>
                    )}
                </div>

                <div className="space-y-5">
                    <div className="flex items-center gap-2">
                        <BsListCheck className="text-yellow-400" />
                        <h2 className="text-2xl font-bold">Zadania</h2>
                    </div>

                    {tasks.length === 0 && (
                        <p className="text-gray-400">Brak zadań w tej lekcji.</p>
                    )}

                    {tasks.map((task, index) => (
                        <div key={task.id} className="bg-gray-800 p-5 rounded-xl space-y-4 border border-gray-700/60">
                            <div className="flex items-center justify-between gap-4">
                                <h3 className="text-yellow-400 font-semibold">
                                    Zadanie {index + 1}
                                </h3>

                                <span className="text-xs px-3 py-1 rounded-full bg-gray-900 border border-gray-700 text-gray-400">
                                    {task.type || "TEXT"} {task.language ? `- ${task.language}` : ""}
                                </span>
                            </div>

                            <p className="text-gray-300 whitespace-pre-line">
                                {task.taskContent}
                            </p>

                            {task.type === "CODE" && task.starterCode && (
                                <div>
                                    <div className="flex items-center gap-2 text-green-400 mb-2">
                                        <BsCodeSlash />
                                        <span>Kod startowy</span>
                                    </div>

                                    <pre className="bg-gray-950 border border-gray-700 p-4 rounded-xl text-green-400 whitespace-pre-wrap font-mono">
                                        {task.starterCode}
                                    </pre>
                                </div>
                            )}

                            {task.hint && (
                                <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 p-3 rounded-xl flex gap-2">
                                    <BsLightbulb className="mt-1 shrink-0" />
                                    <div>
                                        <strong>Podpowiedź:</strong> {task.hint}
                                    </div>
                                </div>
                            )}

                            <textarea
                                className="w-full bg-gray-900 p-3 rounded-xl text-green-400 font-mono border border-gray-700 outline-none focus:border-blue-500"
                                rows={task.type === "CODE" ? 10 : 5}
                                placeholder={task.type === "CODE" ? "Dokończ kod..." : "Wpisz odpowiedź..."}
                                value={answers[task.id] || ""}
                                onChange={(e) =>
                                    setAnswers(prev => ({
                                        ...prev,
                                        [task.id]: e.target.value
                                    }))
                                }
                            />

                            <button
                                onClick={() => check(task.id)}
                                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl font-semibold transition"
                            >
                                Sprawdź
                            </button>

                            {results[task.id] !== undefined && (
                                <div
                                    className={`flex items-center gap-2 p-3 rounded-xl border ${
                                        results[task.id]
                                            ? "bg-green-500/10 border-green-500/30 text-green-400"
                                            : "bg-red-500/10 border-red-500/30 text-red-400"
                                    }`}
                                >
                                    {results[task.id] ? <BsCheckCircle /> : <BsXCircle />}
                                    <span>
                                        {results[task.id] ? "Poprawna odpowiedź" : "Błędna odpowiedź"}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}

                    {tasks.length > 0 && (
                        <button
                            onClick={submitAll}
                            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-semibold transition"
                        >
                            Wyślij wszystkie zadania do nauczyciela
                        </button>
                    )}
                </div>
            </div>

            <aside className="hidden xl:block sticky top-8 h-fit bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-lg font-bold mb-4">Plan lekcji</h2>

                <div className="space-y-2">
                    {moduleLessons.map((l, index) => {
                        const active = Number(lessonId) === l.id;

                        return (
                            <button
                                key={l.id}
                                disabled={!l.canAccess}
                                onClick={() => {
                                    if (l.canAccess) {
                                        navigate(`/lesson/${l.id}`);
                                    }
                                }}
                                className={`w-full text-left p-3 rounded-xl border transition ${
                                    active
                                        ? "bg-blue-600/20 border-blue-500 text-blue-300"
                                        : l.canAccess
                                            ? "bg-gray-800 border-gray-700 hover:border-blue-500"
                                            : "bg-gray-800/50 border-gray-800 opacity-50 cursor-not-allowed"
                                }`}
                            >
                                <div className="text-sm text-gray-400">
                                    Lekcja {l.orderIndex ?? index + 1}
                                </div>

                                <div className="font-semibold flex items-center justify-between gap-2">
                                    <span>{l.title}</span>
                                    {l.canAccess ? <BsArrowRight /> : <BsXCircle />}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </aside>
        </div>
    );
}
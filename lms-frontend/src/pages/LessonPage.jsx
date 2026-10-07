import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import {
    BsXCircle,
    BsArrowRight
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

    const [blocks, setBlocks] = useState([]);
    const [selectedBlock, setSelectedBlock] = useState(null);

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

        apiFetch(`/lesson-blocks/lesson/${lessonId}`)
            .then(data => {
                const sorted = [...(data || [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
                setBlocks(sorted);

                if (sorted.length > 0) {
                    setSelectedBlock(sorted[0]);
                }
            })
            .catch(e => {
                console.error("BLOCKS ERROR:", e);
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
        <div className="grid grid-cols-1 xl:grid-cols-[260px_1fr_320px] gap-8 text-white">

            <aside className="bg-gray-900 border border-gray-800 rounded-2xl p-4 h-fit sticky top-8">
                <h2 className="text-lg font-bold mb-4">Lekcja</h2>

                <div className="space-y-2">
                    {blocks.map((block, index) => (
                        <button
                            key={block.id}
                            onClick={() => setSelectedBlock(block)}
                            className={`w-full text-left p-3 rounded-xl border transition ${
                                selectedBlock?.id === block.id
                                    ? "bg-blue-600/20 border-blue-500 text-blue-300"
                                    : "bg-gray-800 border-gray-700 hover:border-blue-500"
                            }`}
                        >
                            <div className="text-xs text-gray-400">
                                {block.type}
                            </div>
                            <div className="font-semibold">
                                {index + 1}. {block.title || block.type}
                            </div>
                        </button>
                    ))}
                </div>
            </aside>

            <main className="max-w-4xl space-y-8">
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

                {!selectedBlock ? (
                    <div className="bg-gray-800 p-6 rounded-xl text-gray-400">
                        Brak bloków w tej lekcji.
                    </div>
                ) : selectedBlock.type === "THEORY" ? (
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h2 className="text-blue-400 text-xl font-bold mb-4">
                            {selectedBlock.title || "Teoria"}
                        </h2>
                        <p className="whitespace-pre-line text-gray-300">
                            {selectedBlock.content}
                        </p>
                    </div>
                ) : selectedBlock.type === "EXAMPLE" ? (
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h2 className="text-green-400 text-xl font-bold mb-4">
                            {selectedBlock.title || "Przykład"}
                        </h2>
                        <pre className="bg-gray-950 p-4 rounded-xl text-green-400 whitespace-pre-wrap font-mono border border-gray-700">
                        {selectedBlock.content}
                    </pre>
                    </div>
                ) : selectedBlock.type === "IMAGE" ? (
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h2 className="text-purple-400 text-xl font-bold mb-4">
                            {selectedBlock.title || "Grafika"}
                        </h2>
                        <img
                            src={selectedBlock.content}
                            alt={selectedBlock.title || "Grafika lekcji"}
                            className="rounded-xl border border-gray-700 bg-gray-900"
                        />
                    </div>
                ) : selectedBlock.type === "TASK" ? (
                    <TaskBlock
                        block={selectedBlock}
                        tasks={tasks}
                        answers={answers}
                        setAnswers={setAnswers}
                        results={results}
                        check={check}
                    />
                ) : (
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h2 className="text-purple-400 text-xl font-bold mb-4">
                            {selectedBlock.title || selectedBlock.type}
                        </h2>
                        <p className="whitespace-pre-line text-gray-300">
                            {selectedBlock.content}
                        </p>
                    </div>
                )}

                {tasks.length > 0 && (
                    <button
                        onClick={submitAll}
                        className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-semibold transition"
                    >
                        Wyślij wszystkie zadania do nauczyciela
                    </button>
                )}
            </main>

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
function TaskBlock({ block, tasks, answers, setAnswers, results, check }) {
    const task = tasks.find(t => t.id === block.taskId);

    if (!task) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-5 rounded-xl">
                Nie znaleziono zadania dla tego bloku.
            </div>
        );
    }

    return (
        <div className="bg-gray-800 p-6 rounded-xl space-y-4 border border-gray-700">
            <h2 className="text-yellow-400 text-xl font-bold">
                {block.title || "Zadanie"}
            </h2>

            <p className="text-gray-300 whitespace-pre-line">
                {task.taskContent}
            </p>

            {task.starterCode && (
                <pre className="bg-gray-950 border border-gray-700 p-4 rounded-xl text-green-400 whitespace-pre-wrap font-mono">
                    {task.starterCode}
                </pre>
            )}

            {task.hint && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 p-3 rounded-xl">
                    <strong>Podpowiedź:</strong> {task.hint}
                </div>
            )}

            <textarea
                className="w-full bg-gray-900 p-3 rounded-xl text-green-400 font-mono border border-gray-700 outline-none focus:border-blue-500"
                rows={task.type === "CODE" ? 12 : 6}
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
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl font-semibold"
            >
                Sprawdź
            </button>

            {results[task.id] !== undefined && (
                <div className={`p-3 rounded-xl border ${
                    results[task.id]
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}>
                    {results[task.id] ? "Poprawna odpowiedź" : "Błędna odpowiedź"}
                </div>
            )}
        </div>
    );
}
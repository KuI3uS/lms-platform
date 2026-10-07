import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../api/api";
import Editor from "@monaco-editor/react";

export default function LessonPage() {
    const { lessonId } = useParams();

    const [lesson, setLesson] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [answers, setAnswers] = useState({});
    const [results, setResults] = useState({});
    const [error, setError] = useState(null);

    const [blocks, setBlocks] = useState([]);
    const [selectedBlock, setSelectedBlock] = useState(null);

    useEffect(() => {
        if (!lessonId) return;

        const loadLesson = async () => {
            try {
                setError(null);
                setLesson(null);
                setTasks([]);
                setAnswers({});
                setResults({});
                setBlocks([]);
                setSelectedBlock(null);

                const lessonData = await apiFetch(`/lessons/${lessonId}`);
                setLesson(lessonData);

                const blocksData = await apiFetch(`/lesson-blocks/lesson/${lessonId}`);
                const sortedBlocks = [...(blocksData || [])].sort(
                    (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
                );

                setBlocks(sortedBlocks);
                setSelectedBlock(sortedBlocks[0] || null);

                const tasksData = await apiFetch(`/tasks/lesson/${lessonId}`);
                const sortedTasks = [...(tasksData || [])].sort(
                    (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
                );

                setTasks(sortedTasks);

                const startAnswers = {};
                sortedTasks.forEach(task => {
                    if (task.type === "CODE") {
                        startAnswers[task.id] = task.starterCode || "";
                    }
                });

                setAnswers(startAnswers);
            } catch (e) {
                console.error(e);
                setError(e.message);
            }
        };

        loadLesson();
    }, [lessonId]);

    const check = async (taskId) => {
        try {
            const res = await apiFetch(`/tasks/${taskId}/check`, {
                method: "POST",
                body: JSON.stringify({
                    answer: answers[taskId] || ""
                })
            });

            const correct = typeof res === "boolean" ? res : res.correct;

            setResults(prev => ({
                ...prev,
                [taskId]: correct
            }));
        } catch (e) {
            console.error(e);
            alert("Błąd sprawdzania odpowiedzi");
        }
    };

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

    if (error) {
        return (
            <div className="min-h-screen bg-gray-950 text-red-400 p-8">
                Błąd: {error}
            </div>
        );
    }

    if (!lesson) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8">
            <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-8">

                <aside className="bg-gray-900 border border-gray-800 rounded-2xl p-4 h-fit xl:sticky xl:top-8">
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

                <main className="space-y-8 min-w-0">
                    <div>
                        <h1 className="text-3xl font-bold">{lesson.title}</h1>

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
                    ) : selectedBlock.type === "TASK" ? (
                        <TaskBlock
                            block={selectedBlock}
                            tasks={tasks}
                            answers={answers}
                            setAnswers={setAnswers}
                            results={results}
                            check={check}
                        />
                    ) : selectedBlock.type === "EXAMPLE" ? (
                        <ExampleBlock block={selectedBlock} />
                    ) : selectedBlock.type === "IMAGE" ? (
                        <ImageBlock block={selectedBlock} />
                    ) : (
                        <TextBlock block={selectedBlock} />
                    )}

                    {tasks.length > 0 && (
                        <button
                            onClick={submitAll}
                            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-semibold"
                        >
                            Wyślij wszystkie zadania do nauczyciela
                        </button>
                    )}
                </main>
            </div>
        </div>
    );
}

function TextBlock({ block }) {
    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-blue-400 text-xl font-bold mb-4">
                {block.title || block.type}
            </h2>

            <p className="whitespace-pre-line text-gray-300 leading-relaxed">
                {block.content}
            </p>
        </div>
    );
}

function ExampleBlock({ block }) {
    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-green-400 text-xl font-bold mb-4">
                {block.title || "Przykład"}
            </h2>

            <pre className="bg-gray-950 p-4 rounded-xl text-green-400 whitespace-pre-wrap font-mono border border-gray-700 overflow-x-auto">
                {block.content}
            </pre>
        </div>
    );
}

function ImageBlock({ block }) {
    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-purple-400 text-xl font-bold mb-4">
                {block.title || "Grafika"}
            </h2>

            <img
                src={block.content}
                alt={block.title || "Grafika lekcji"}
                className="rounded-xl border border-gray-700 bg-gray-900 max-w-full"
            />
        </div>
    );
}

function TaskBlock({ block, tasks, answers, setAnswers, results, check }) {
    const task = tasks.find(t => Number(t.id) === Number(block.taskId));

    if (!task) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-5 rounded-xl">
                Nie znaleziono zadania dla tego bloku.
            </div>
        );
    }

    return (
        <div className="bg-gray-800 p-6 rounded-xl space-y-5 border border-gray-700">
            <h2 className="text-yellow-400 text-xl font-bold">
                {block.title || "Zadanie"}
            </h2>

            <p className="text-gray-300 whitespace-pre-line leading-relaxed">
                {task.taskContent}
            </p>

            {task.hint && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 p-3 rounded-xl">
                    <strong>Podpowiedź:</strong> {task.hint}
                </div>
            )}

            {task.type === "CODE" ? (
                <div className="border border-gray-700 rounded-xl overflow-hidden">
                    <Editor
                        height="520px"
                        language={task.language || "java"}
                        theme="vs-dark"
                        value={answers[task.id] ?? ""}
                        onChange={(value) =>
                            setAnswers(prev => ({
                                ...prev,
                                [task.id]: value || ""
                            }))
                        }
                        options={{
                            minimap: { enabled: false },
                            fontSize: 15,
                            automaticLayout: true,
                            scrollBeyondLastLine: false,
                            wordWrap: "on",
                            tabSize: 4
                        }}
                    />
                </div>
            ) : (
                <textarea
                    className="w-full bg-gray-900 p-4 rounded-xl border border-gray-700 outline-none focus:border-blue-500"
                    rows={8}
                    value={answers[task.id] || ""}
                    onChange={(e) =>
                        setAnswers(prev => ({
                            ...prev,
                            [task.id]: e.target.value
                        }))
                    }
                />
            )}

            <button
                onClick={() => check(task.id)}
                className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold"
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
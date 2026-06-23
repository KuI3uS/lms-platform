import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api/api";
import Editor from "@monaco-editor/react";
import { BsArrowRight, BsCheckCircle, BsXCircle } from "react-icons/bs";

export default function LessonPage() {
    const { lessonId } = useParams();
    const navigate = useNavigate();

    const [lesson, setLesson] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [blocks, setBlocks] = useState([]);
    const [selectedBlock, setSelectedBlock] = useState(null);

    const [moduleLessons, setModuleLessons] = useState([]);
    const [answers, setAnswers] = useState({});
    const [results, setResults] = useState({});
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!lessonId) return;

        const load = async () => {
            try {
                setError(null);
                setLesson(null);
                setTasks([]);
                setBlocks([]);
                setSelectedBlock(null);
                setAnswers({});
                setResults({});

                const lessonData = await apiFetch(`/lessons/${lessonId}`);
                setLesson(lessonData);

                if (lessonData?.moduleId) {
                    const lessonsData = await apiFetch(`/lessons/module/${lessonData.moduleId}`);

                    const lessonsWithAccess = await Promise.all(
                        (lessonsData || []).map(async (l) => {
                            try {
                                const canAccess = await apiFetch(`/lessons/${l.id}/access`);
                                return { ...l, canAccess };
                            } catch {
                                return { ...l, canAccess: false };
                            }
                        })
                    );

                    setModuleLessons(
                        [...lessonsWithAccess].sort(
                            (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
                        )
                    );
                }

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

        load();
    }, [lessonId]);

    const taskBlocks = blocks.filter(b => b.type === "TASK");
    const completedCount = moduleLessons.filter(l => l.completed).length;
    const progress = moduleLessons.length > 0
        ? Math.round((completedCount / moduleLessons.length) * 100)
        : 0;

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

    const goBackToCourse = () => {
        if (lesson?.moduleId) {
            navigate(`/lessons/${lesson.moduleId}`);
        } else {
            navigate("/courses");
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
        <div className="min-h-screen bg-gray-950 text-white p-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 xl:grid-cols-[1fr_330px] gap-8">

                <main className="space-y-6 min-w-0">
                    <header className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div>
                                <p className="text-sm text-blue-400 mb-2">
                                    Lekcja {lesson.orderIndex ?? ""}
                                </p>

                                <h1 className="text-3xl font-bold">
                                    {lesson.title}
                                </h1>

                                {lesson.freePreview && (
                                    <p className="mt-2 text-sm text-green-400">
                                        Darmowy podgląd lekcji
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={goBackToCourse}
                                className="bg-gray-800 hover:bg-gray-700 border border-gray-700 px-5 py-3 rounded-xl font-semibold transition"
                            >
                                ← Wróć do kursu
                            </button>
                        </div>
                    </header>

                    {taskBlocks.length > 0 && (
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                            <p className="text-sm text-gray-400 mb-3">
                                Zadania w tej lekcji
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {taskBlocks.map((block, index) => (
                                    <button
                                        key={block.id}
                                        onClick={() => setSelectedBlock(block)}
                                        className={`px-4 py-2 rounded-xl border font-semibold transition ${
                                            selectedBlock?.id === block.id
                                                ? "bg-blue-600 border-blue-500 text-white"
                                                : "bg-gray-800 border-gray-700 text-gray-300 hover:border-blue-500"
                                        }`}
                                    >
                                        Zadanie {index + 1}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {!selectedBlock ? (
                        <EmptyBlock />
                    ) : selectedBlock.type === "TASK" ? (
                        <TaskBlock
                            block={selectedBlock}
                            blocks={blocks}
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
                            className="w-full bg-purple-600 hover:bg-purple-700 px-6 py-4 rounded-2xl font-bold transition"
                        >
                            Wyślij wszystkie zadania do nauczyciela
                        </button>
                    )}
                </main>

                <aside className="bg-gray-900 border border-gray-800 rounded-2xl p-5 h-fit xl:sticky xl:top-6">
                    <h2 className="text-xl font-bold mb-4">
                        Plan modułu
                    </h2>

                    <div className="bg-gray-800 rounded-xl p-4 mb-5">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-400">Postęp</span>
                            <span className="font-bold">{progress}%</span>
                        </div>

                        <div className="w-full bg-gray-700 rounded-full h-3">
                            <div
                                className="bg-blue-500 h-3 rounded-full"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        {moduleLessons.map((l, index) => {
                            const active = Number(lessonId) === Number(l.id);

                            return (
                                <button
                                    key={l.id}
                                    disabled={!l.canAccess}
                                    onClick={() => {
                                        if (l.canAccess) {
                                            navigate(`/lesson/${l.id}`);
                                        }
                                    }}
                                    className={`w-full text-left p-4 rounded-xl border transition ${
                                        active
                                            ? "bg-blue-600/20 border-blue-500 text-blue-300"
                                            : l.canAccess
                                                ? "bg-gray-800 border-gray-700 hover:border-blue-500"
                                                : "bg-gray-800/40 border-gray-800 opacity-50 cursor-not-allowed"
                                    }`}
                                >
                                    <div className="flex justify-between items-center gap-3">
                                        <div>
                                            <p className="text-xs text-gray-400">
                                                Lekcja {l.orderIndex ?? index + 1}
                                            </p>

                                            <p className="font-semibold">
                                                {l.title}
                                            </p>
                                        </div>

                                        {l.completed ? (
                                            <BsCheckCircle className="text-green-400 shrink-0" />
                                        ) : l.canAccess ? (
                                            <BsArrowRight className="text-gray-400 shrink-0" />
                                        ) : (
                                            <BsXCircle className="text-red-400 shrink-0" />
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </aside>
            </div>
        </div>
    );
}

function EmptyBlock() {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-gray-400">
            Brak treści w tej lekcji.
        </div>
    );
}

function TextBlock({ block }) {
    return (
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-blue-400 mb-5">
                {block.title || "Teoria"}
            </h2>

            <p className="whitespace-pre-line text-gray-300 leading-relaxed text-lg">
                {block.content}
            </p>
        </section>
    );
}

function ExampleBlock({ block }) {
    return (
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-green-400 mb-5">
                {block.title || "Przykład"}
            </h2>

            <pre className="bg-gray-950 p-5 rounded-xl text-green-400 whitespace-pre-wrap font-mono border border-gray-700 overflow-x-auto">
                {block.content}
            </pre>
        </section>
    );
}

function ImageBlock({ block }) {
    return (
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-purple-400 mb-5">
                {block.title || "Grafika"}
            </h2>

            <img
                src={block.content}
                alt={block.title || "Grafika lekcji"}
                className="rounded-xl border border-gray-700 bg-gray-950 max-w-full"
            />
        </section>
    );
}

function TaskBlock({ block, blocks, tasks, answers, setAnswers, results, check }) {
    const task = tasks.find(t => Number(t.id) === Number(block.taskId));
    const taskNumber = blocks
        .filter(b => b.type === "TASK")
        .findIndex(b => Number(b.id) === Number(block.id)) + 1;

    if (!task) {
        return (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-5 rounded-xl">
                Nie znaleziono zadania dla tego bloku.
            </div>
        );
    }

    return (
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-6">
            <div>
                <p className="text-sm text-yellow-400 font-semibold mb-2">
                    Zadanie {taskNumber}
                </p>

                <h2 className="text-2xl font-bold text-white">
                    {task.taskContent}
                </h2>
            </div>

            {task.hint && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 p-4 rounded-xl">
                    <strong>Podpowiedź:</strong> {task.hint}
                </div>
            )}

            {task.type === "CODE" ? (
                <div className="border border-gray-700 rounded-2xl overflow-hidden">
                    <Editor
                        height="560px"
                        language={task.language || "java"}
                        theme="vs-dark"
                        value={answers[task.id] ?? task.starterCode ?? ""}
                        onChange={(value) =>
                            setAnswers(prev => ({
                                ...prev,
                                [task.id]: value || ""
                            }))
                        }
                        options={{
                            minimap: { enabled: false },
                            fontSize: 16,
                            automaticLayout: true,
                            scrollBeyondLastLine: false,
                            wordWrap: "on",
                            tabSize: 4
                        }}
                    />
                </div>
            ) : (
                <textarea
                    className="w-full bg-gray-950 p-5 rounded-2xl border border-gray-700 outline-none focus:border-blue-500 min-h-72 text-gray-200"
                    placeholder="Wpisz swoją odpowiedź..."
                    value={answers[task.id] || ""}
                    onChange={(e) =>
                        setAnswers(prev => ({
                            ...prev,
                            [task.id]: e.target.value
                        }))
                    }
                />
            )}

            <div className="flex flex-wrap gap-3">
                <button
                    onClick={() => check(task.id)}
                    className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold"
                >
                    Sprawdź
                </button>

                <button
                    onClick={() =>
                        setAnswers(prev => ({
                            ...prev,
                            [task.id]: task.type === "CODE" ? task.starterCode || "" : ""
                        }))
                    }
                    className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-xl font-bold"
                >
                    Reset
                </button>
            </div>

            {results[task.id] !== undefined && (
                <div className={`p-4 rounded-xl border font-semibold ${
                    results[task.id]
                        ? "bg-green-500/10 border-green-500/30 text-green-400"
                        : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}>
                    {results[task.id]
                        ? "Poprawna odpowiedź"
                        : "Odpowiedź wymaga poprawy"}
                </div>
            )}
        </section>
    );
}
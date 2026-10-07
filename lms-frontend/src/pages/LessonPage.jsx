import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../api/api";

export default function LessonPage() {
    const { lessonId } = useParams();

    const [lesson, setLesson] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [answers, setAnswers] = useState({});
    const [results, setResults] = useState({});
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!lessonId) return;

        apiFetch(`/lessons/${lessonId}`)
            .then(setLesson)
            .catch(e => {
                console.error("LESSON ERROR:", e);
                setError(e.message);
            });

        apiFetch(`/tasks/lesson/${lessonId}`)
            .then(data => setTasks(data || []))
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
        <div className="max-w-4xl mx-auto space-y-8 text-white">

            <h1 className="text-3xl font-bold">
                {lesson.title}
            </h1>

            <div className="bg-gray-800 p-5 rounded space-y-4">
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
                    <pre className="bg-gray-900 p-4 rounded text-green-400 whitespace-pre-wrap">
                        {lesson.example || "BRAK PRZYKŁADU"}
                    </pre>
                </div>
            </div>

            <div className="space-y-5">
                {tasks.length === 0 && (
                    <p className="text-gray-400">Brak zadań w tej lekcji.</p>
                )}

                {tasks.map((task, index) => (
                    <div key={task.id} className="bg-gray-800 p-5 rounded space-y-3">

                        <h3 className="text-yellow-400 font-semibold">
                            Zadanie {index + 1}
                        </h3>

                        <p className="text-gray-300 whitespace-pre-line">
                            {task.taskContent}
                        </p>

                        <textarea
                            className="w-full bg-gray-900 p-3 rounded text-green-400 font-mono"
                            rows={5}
                            placeholder="Wpisz odpowiedź..."
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
                            className="bg-blue-600 px-4 py-2 rounded"
                        >
                            Sprawdź
                        </button>

                        {results[task.id] !== undefined && (
                            <p className={results[task.id] ? "text-green-400" : "text-red-400"}>
                                {results[task.id] ? "Poprawna odpowiedź" : "Błędna odpowiedź"}
                            </p>
                        )}

                    </div>

                ))}
                {tasks.length > 0 && (
                    <button
                        onClick={submitAll}
                        className="bg-purple-600 px-6 py-3 rounded font-semibold"
                    >
                        Wyślij wszystkie zadania do nauczyciela
                    </button>
                )}
            </div>
        </div>
    );
}
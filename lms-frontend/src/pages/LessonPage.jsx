import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../api/api";

export default function LessonPage() {

    const { taskId } = useParams();

    const [task, setTask] = useState(null);
    const [answer, setAnswer] = useState("");
    const [result, setResult] = useState("");

    useEffect(() => {
        apiFetch(`/tasks/${taskId}`)
            .then(setTask)
            .catch(console.error);
    }, [taskId]);

    if (!task) return <p>Loading...</p>;

    const check = () => {
        if (answer.trim().toLowerCase() === task.expectedAnswer.toLowerCase()) {
            setResult("Poprawna odpowiedź");
        } else {
            setResult("Spróbuj ponownie");
        }
    };

    return (
        <div className="space-y-6">

            <h1 className="text-3xl font-bold">
                {task.title}
            </h1>

            {/* TEORIA */}
            <div>
                <h2 className="text-blue-400 font-semibold mb-2">
                    📘 Wytłumaczenie
                </h2>
                <p className="text-gray-300 whitespace-pre-line">
                    {task.theory || "BRAK TEORII"}
                </p>
            </div>
            {/* PRZYKŁAD */}
            <div>
                <h2 className="text-green-400 font-semibold mb-2">
                    💡 Przykład
                </h2>
                <pre className="bg-gray-900 p-4 rounded text-green-400 font-mono">
            {task.example || "BRAK PRZYKŁADU"}
        </pre>
            </div>
            {/* ZADANIE */}
            <div>
                <h3 className="text-yellow-400 font-semibold mb-2">
                    🧠 Zadanie
                </h3>
                <p className="text-gray-300">
                    {task.taskContent || "BRAK ZADANIA"}
                </p>
            </div>

            {/* ZADANIE */}
            <div className="bg-gray-800 p-4 rounded space-y-3">

                <h2 className="font-semibold">Twoja odpowiedź:</h2>

                <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-full bg-gray-700 p-2 rounded"
                    rows={4}
                />

                <button
                    onClick={check}
                    className="bg-blue-600 px-4 py-2 rounded"
                >
                    Sprawdź
                </button>

                {result && <p>{result}</p>}

            </div>

        </div>
    );
}
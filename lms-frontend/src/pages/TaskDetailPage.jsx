import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../api/api";

export default function TaskDetailPage() {

    const { id } = useParams();

    const [task, setTask] = useState(null);
    const [answer, setAnswer] = useState("");
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        apiFetch(`/tasks/${id}`)
            .then(data => {
                console.log("DETAIL TASK:", data);
                setTask(data);
            })
            .catch(e => {
                console.error("DETAIL ERROR:", e);
                setError(e.message);
            });
    }, [id]);

    const check = async () => {
        try {
            const res = await apiFetch(`/tasks/${id}/check`, {
                method: "POST",
                body: JSON.stringify(answer)
            });
            setResult(res);
        } catch (e) {
            console.error(e);
            alert("Błąd sprawdzania");
        }
    };

    if (error) return <div className="text-red-400">Błąd: {error}</div>;
    if (!task) return <div className="text-white">Loading...</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6 text-white">

            <h1 className="text-3xl font-bold">{task.title}</h1>

            <div className="bg-gray-800 p-6 rounded-xl space-y-5">

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

            </div>

            {/* INPUT */}
            <div className="space-y-3">

                <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-full h-40 p-4 bg-gray-900 text-green-400 font-mono rounded"
                    placeholder="Wpisz SQL..."
                />

                <button
                    onClick={check}
                    className="bg-blue-600 px-6 py-2 rounded"
                >
                    Sprawdź
                </button>

                {result !== null && (
                    <div className={result ? "text-green-400" : "text-red-400"}>
                        {result ? "Poprawna odpowiedź" : "Błędna odpowiedź"}
                    </div>
                )}

            </div>

        </div>
    );
}
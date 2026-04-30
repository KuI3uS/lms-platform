import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";

export default function TaskPage() {

    const { moduleId } = useParams();
    const navigate = useNavigate();

    const [tasks, setTasks] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        apiFetch(`/tasks/module/${moduleId}`)
            .then(data => {
                console.log("TASK LIST:", data);
                setTasks(data || []);
            })
            .catch(e => {
                console.error("TASK LIST ERROR:", e);
                setError(e.message);
            });
    }, [moduleId]);

    if (error) return <p className="text-red-400">Błąd: {error}</p>;
    if (!tasks.length) return <p className="text-white">Brak lekcji</p>;

    return (
        <div className="max-w-3xl mx-auto space-y-6 text-white">

            <h1 className="text-3xl font-bold">📚 Lekcje</h1>

            {tasks.map((t) => (
                <div
                    key={t.id}
                    onClick={() => {
                        console.log("CLICK:", t.id);
                        navigate(`/lesson/${t.id}`);
                    }}
                    className="bg-gray-800 p-5 rounded-xl cursor-pointer hover:bg-gray-700 transition"
                >
                    <h2 className="text-lg font-semibold">
                        {t.title}
                    </h2>
                </div>
            ))}

        </div>
    );
}
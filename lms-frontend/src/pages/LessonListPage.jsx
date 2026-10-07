import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";

export default function LessonListPage() {

    const { moduleId } = useParams();
    const navigate = useNavigate();

    const [lessons, setLessons] = useState([]);

    useEffect(() => {
        apiFetch(`/lessons/module/${moduleId}`)
            .then(setLessons)
            .catch(console.error);
    }, [moduleId]);

    return (
        <div className="max-w-3xl mx-auto space-y-6 text-white">

            <h1 className="text-3xl font-bold">📚 Lekcje</h1>

            {lessons.map(l => (
                <div
                    key={l.id}
                    onClick={() => navigate(`/lesson/${l.id}`)}
                    className="bg-gray-800 p-5 rounded-xl cursor-pointer hover:bg-gray-700"
                >
                    <h2 className="text-lg font-semibold">
                        {l.orderIndex}. {l.title}
                    </h2>
                </div>
            ))}

        </div>
    );
}
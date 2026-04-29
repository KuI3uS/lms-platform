import { useState } from "react";
import { apiFetch } from "../api/api";

export default function AddQuestionPage() {

    const [moduleId, setModuleId] = useState("");
    const [content, setContent] = useState("");
    const [answers, setAnswers] = useState([
        { content: "", correct: false },
        { content: "", correct: false }
    ]);

    const updateAnswer = (i, field, value) => {
        const copy = [...answers];
        copy[i][field] = value;
        setAnswers(copy);
    };

    const submit = async () => {
        await apiFetch(`/questions/module/${moduleId}`, {
            method: "POST",
            body: JSON.stringify({ content, answers })
        });

        alert("Dodano pytanie");
    };

    return (
        <div className="space-y-4">

            <h1 className="text-2xl font-bold">Dodaj pytanie</h1>

            <input
                placeholder="ID modułu"
                className="p-2 bg-gray-700"
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
            />

            <input
                placeholder="Treść pytania"
                className="p-2 bg-gray-700 w-full"
                value={content}
                onChange={(e) => setContent(e.target.value)}
            />

            {answers.map((a, i) => (
                <div key={i} className="flex gap-2">
                    <input
                        className="p-2 bg-gray-700 flex-1"
                        placeholder="Odpowiedź"
                        value={a.content}
                        onChange={(e) => updateAnswer(i, "content", e.target.value)}
                    />
                    <input
                        type="checkbox"
                        checked={a.correct}
                        onChange={(e) => updateAnswer(i, "correct", e.target.checked)}
                    />
                </div>
            ))}

            <button
                onClick={submit}
                className="bg-blue-600 px-4 py-2 rounded"
            >
                Dodaj
            </button>

        </div>
    );
}
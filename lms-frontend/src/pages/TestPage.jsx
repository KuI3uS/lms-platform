import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../api/api";

export default function TestPage() {

    const { moduleId } = useParams();

    const [questions, setQuestions] = useState([]);
    const [selectedAnswers, setSelectedAnswers] = useState({});

    useEffect(() => {
        apiFetch(`/questions/module/${moduleId}`).then(setQuestions);
    }, []);

    const handleAnswer = (questionId, answerId) => {
        setSelectedAnswers(prev => ({
            ...prev,
            [questionId]: answerId
        }));
    };

    const submitTest = async () => {

        const payload = {
            answers: Object.entries(selectedAnswers).map(([qId, aId]) => ({
                questionId: Number(qId),
                answerId: aId
            })),
            tabSwitchCount: 0
        };

        const result = await apiFetch(`/submit/module/${moduleId}`, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        alert(`Wynik: ${result.percentage}%`);
    };

    return (
        <div>
            <h1>Test</h1>

            {questions.map(q => (
                <div key={q.id}>
                    <p>{q.content}</p>

                    {q.answers.map(a => (
                        <label key={a.id}>
                            <input
                                type="radio"
                                name={"q-" + q.id}
                                checked={selectedAnswers[q.id] === a.id}
                                onChange={() => handleAnswer(q.id, a.id)}
                            />
                            {a.content}
                        </label>
                    ))}
                </div>
            ))}

            <button
                onClick={submitTest}
                disabled={Object.keys(selectedAnswers).length === 0}
            >
                Zakończ test
            </button>
        </div>
    );
}
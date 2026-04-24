import { useEffect, useState } from "react";
import { apiFetch } from "./api/api";

export default function Dashboard() {

    const [user, setUser] = useState(null);
    const [courses, setCourses] = useState([]);
    const [modules, setModules] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [selectedModule, setSelectedModule] = useState(null);
    const [selectedAnswers, setSelectedAnswers] = useState({});

    useEffect(() => {
        apiFetch("/me").then(setUser);
        apiFetch("/courses").then(setCourses);
    }, []);

    const loadModules = (course) => {
        setSelectedCourse(course);
        apiFetch(`/modules/course/${course.id}`)
            .then(setModules);
    };
    const loadQuestions = (module) => {
        setSelectedModule(module);
        apiFetch(`/questions/module/${module.id}`)
            .then(setQuestions)
            .catch(console.error);
    };
    const submitTest = async () => {

        const payload = {
            answers: Object.entries(selectedAnswers).map(([questionId, answerId]) => ({
                questionId: Number(questionId),
                answerId: answerId
            })),
            tabSwitchCount: 0
        };

        try {
            const result = await apiFetch(`/submit/task/${selectedModule.id}`, {
                method: "POST",
                body: JSON.stringify(payload)
            });

            alert(`Wynik: ${result.percentage}%`);
        } catch (e) {
            console.error(e);
            alert("Błąd wysyłania");
        }
    };
    const handleAnswer = (questionId, answerId) => {
        setSelectedAnswers(prev => ({
            ...prev,
            [questionId]: answerId
        }));
    };
    const box = {
        border: "1px solid #aaa",
        margin: "10px auto",
        padding: "10px",
        width: "200px",
        borderRadius: "10px",
        cursor: "pointer"
    };

    return (
        <div style={{ textAlign: "center" }}>
            <h1>Dashboard</h1>

            {user && <p>Email: {user.username}</p>}

            <h2>Kursy:</h2>

            {!selectedCourse && (
                <div>
                    {courses.map(c => (
                        <div
                            key={c.id}
                            onClick={() => loadModules(c)}
                            style={box}
                        >
                            {c.name}
                        </div>
                    ))}
                </div>
            )}

            {selectedCourse && !selectedModule && (
                <div>
                    <h2>Moduły: {selectedCourse.name}</h2>

                    {modules.map(m => (
                        <div
                            key={m.id}
                            onClick={() => loadQuestions(m)}
                            style={box}
                        >
                            {m.name}
                        </div>
                    ))}

                    <button onClick={() => {
                        setSelectedCourse(null);
                        setModules([]);
                    }}>
                        ← Wróć
                    </button>
                </div>
            )}

            {selectedModule && (
                <div>
                    <h2>Pytania</h2>

                    {questions.map(q => (
                        <div key={q.id} style={{
                            border: "1px solid #ccc",
                            margin: "15px auto",
                            padding: "10px",
                            width: "300px",
                            borderRadius: "10px"
                        }}>
                            <p>{q.content}</p>

                            {q.answers.map(a => (
                                <div key={a.id}>
                                    <label>
                                        <input
                                            type="radio"
                                            name={"q-" + q.id}
                                            checked={selectedAnswers[q.id] === a.id}
                                            onChange={() => handleAnswer(q.id, a.id)}
                                        />
                                        {a.content}
                                    </label>
                                </div>
                            ))}
                        </div>
                    ))}

                    <button onClick={() => {
                        setSelectedModule(null);
                        setQuestions([]);
                    }}>
                        ← Wróć
                    </button>
                </div>
            )}
        </div>
    );
}
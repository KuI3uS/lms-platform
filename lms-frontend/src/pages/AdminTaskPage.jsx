import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import { useParams } from "react-router-dom";

export default function AdminTaskPage() {

    const { moduleId } = useParams();

    const [tasks, setTasks] = useState([]);
    const [editingId, setEditingId] = useState(null);

    const [form, setForm] = useState({
        title: "",
        theory: "",
        example: "",
        taskContent: "",
        expectedAnswer: ""
    });

    // 🔥 LOAD
    useEffect(() => {
        apiFetch(`/tasks/module/${moduleId}`)
            .then(data => {
                // sortowanie po kolejności
                const sorted = data.sort((a, b) => a.orderIndex - b.orderIndex);
                setTasks(sorted);
            });
    }, [moduleId]);

    // 🔥 CREATE
    const createTask = async () => {
        try {
            const newTask = await apiFetch(`/tasks/module/${moduleId}`, {
                method: "POST",
                body: JSON.stringify({
                    ...form,
                    orderIndex: tasks.length
                })
            });

            setTasks(prev => [...prev, newTask]);

            resetForm();

        } catch (e) {
            console.error(e);
            alert("Błąd dodawania");
        }
    };

    // 🔥 EDIT START
    const startEdit = (task) => {
        setEditingId(task.id);
        setForm(task);
    };

    // 🔥 UPDATE
    const updateTask = async () => {
        try {
            const updated = await apiFetch(`/tasks/${form.id}`, {
                method: "PUT",
                body: JSON.stringify(form)
            });

            setTasks(prev =>
                prev.map(t => t.id === updated.id ? updated : t)
            );

            setEditingId(null);
            resetForm();

        } catch (e) {
            console.error(e);
        }
    };

    // 🔥 DELETE
    const deleteTask = async (id) => {
        if (!window.confirm("Na pewno usunąć?")) return;

        try {
            await apiFetch(`/tasks/${id}`, {
                method: "DELETE"
            });

            setTasks(prev => prev.filter(t => t.id !== id));

        } catch (e) {
            console.error(e);
        }
    };

    // 🔥 RESET FORM
    const resetForm = () => {
        setForm({
            title: "",
            theory: "",
            example: "",
            taskContent: "",
            expectedAnswer: ""
        });
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 text-white">

            <h1 className="text-3xl font-bold">
                ⚙️ Panel Admina - Zadania
            </h1>

            {/* FORM */}
            <div className="bg-gray-800 p-6 rounded-xl space-y-3">

                <input
                    placeholder="Tytuł"
                    value={form.title}
                    onChange={e => setForm({...form, title: e.target.value})}
                    className="w-full p-2 bg-gray-700 rounded"
                />

                <textarea
                    placeholder="Teoria"
                    value={form.theory}
                    onChange={e => setForm({...form, theory: e.target.value})}
                    className="w-full p-2 bg-gray-700 rounded"
                />

                <textarea
                    placeholder="Przykład"
                    value={form.example}
                    onChange={e => setForm({...form, example: e.target.value})}
                    className="w-full p-2 bg-gray-700 rounded"
                />

                <textarea
                    placeholder="Treść zadania"
                    value={form.taskContent}
                    onChange={e => setForm({...form, taskContent: e.target.value})}
                    className="w-full p-2 bg-gray-700 rounded"
                />

                <input
                    placeholder="Poprawna odpowiedź"
                    value={form.expectedAnswer}
                    onChange={e => setForm({...form, expectedAnswer: e.target.value})}
                    className="w-full p-2 bg-gray-700 rounded"
                />

                <button
                    onClick={editingId ? updateTask : createTask}
                    className="bg-green-600 px-4 py-2 rounded"
                >
                    {editingId ? "💾 Zapisz zmiany" : "➕ Dodaj zadanie"}
                </button>

            </div>

            {/* LIST */}
            <div className="space-y-3">

                {tasks.map(t => (
                    <div
                        key={t.id}
                        className="bg-gray-800 p-4 rounded flex justify-between items-center"
                    >

                        <div>
                            <h2 className="font-semibold">
                                {t.orderIndex}. {t.title}
                            </h2>

                            <p className="text-sm text-gray-400">
                                {t.taskContent}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => startEdit(t)}>✏️</button>
                            <button onClick={() => deleteTask(t.id)}>🗑</button>
                        </div>

                    </div>
                ))}

            </div>

        </div>
    );
}
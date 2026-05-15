import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../api/api";

export default function AdminLessonPage() {

    const { moduleId } = useParams();

    const [lessons, setLessons] = useState([]);
    const [tasks, setTasks] = useState({});
    const [expandedLessonId, setExpandedLessonId] = useState(null);

    const [form, setForm] = useState({
        title: "",
        theory: "",
        example: ""
    });

    const [editingId, setEditingId] = useState(null);

    // 🔥 TASK STATE
    const [taskForms, setTaskForms] = useState({});
    const [editingTaskId, setEditingTaskId] = useState({});

    // =====================
    // LOAD
    // =====================

    useEffect(() => {
        loadLessons();
    }, [moduleId]);

    const loadLessons = async () => {
        const data = await apiFetch(`/lessons/module/${moduleId}`);
        setLessons([...data].sort((a,b) => a.orderIndex - b.orderIndex));
    };

    const loadTasks = async (lessonId) => {
        const data = await apiFetch(`/tasks/lesson/${lessonId}`);

        setTasks(prev => ({
            ...prev,
            [lessonId]: data.sort((a,b)=>a.orderIndex-b.orderIndex)
        }));
    };

    const toggleLesson = (lessonId) => {
        if (expandedLessonId === lessonId) {
            setExpandedLessonId(null);
        } else {
            setExpandedLessonId(lessonId);
            loadTasks(lessonId);
        }
    };

    // =====================
    // LESSON CRUD
    // =====================

    const create = async () => {
        if (!form.title.trim()) {
            alert("Podaj tytuł lekcji");
            return;
        }

        const lesson = await apiFetch(`/lessons/module/${moduleId}`, {
            method: "POST",
            body: JSON.stringify({
                ...form,
                orderIndex: lessons.length
            })
        });

        setLessons(prev => [...prev, lesson]);
        resetLessonForm();
    };

    const startEdit = (l) => {
        setEditingId(l.id);
        setForm(l);
    };

    const update = async () => {
        const updated = await apiFetch(`/lessons/${form.id}`, {
            method: "PUT",
            body: JSON.stringify(form)
        });

        setLessons(prev =>
            prev.map(l => l.id === updated.id ? updated : l)
        );

        setEditingId(null);
        resetLessonForm();
    };

    const deleteLesson = async (id) => {
        await apiFetch(`/lessons/${id}`, { method: "DELETE" });
        setLessons(prev => prev.filter(l => l.id !== id));
    };

    const resetLessonForm = () => {
        setForm({ title: "", theory: "", example: "" });
    };

    // =====================
    // TASK CRUD
    // =====================

    const addTask = async (lessonId) => {
        const form = taskForms[lessonId];

        if (!form || !form.taskContent?.trim()) {
            alert("Uzupełnij treść zadania");
            return;
        }

        await apiFetch(`/tasks/lesson/${lessonId}`, {
            method: "POST",
            body: JSON.stringify({
                taskContent: form.taskContent,
                expectedAnswer: form.expectedAnswer || ""
            })
        });

        await loadTasks(lessonId);

        setTaskForms(prev => ({
            ...prev,
            [lessonId]: { taskContent: "", expectedAnswer: "" }
        }));
    };

    const startEditTask = (lessonId, task) => {
        setEditingTaskId(prev => ({
            ...prev,
            [lessonId]: task.id
        }));

        setTaskForms(prev => ({
            ...prev,
            [lessonId]: task
        }));
    };

    const updateTask = async (lessonId) => {
        const form = taskForms[lessonId];

        const updated = await apiFetch(`/tasks/${form.id}`, {
            method: "PUT",
            body: JSON.stringify(form)
        });

        setTasks(prev => ({
            ...prev,
            [lessonId]: prev[lessonId].map(t =>
                t.id === updated.id ? updated : t
            )
        }));

        setEditingTaskId(prev => ({
            ...prev,
            [lessonId]: null
        }));

        setTaskForms(prev => ({
            ...prev,
            [lessonId]: { taskContent: "", expectedAnswer: "" }
        }));
    };

    const deleteTask = async (lessonId, taskId) => {
        await apiFetch(`/tasks/${taskId}`, { method: "DELETE" });
        await loadTasks(lessonId);
    };

    const moveUp = async (lessonId, id) => {
        const list = tasks[lessonId] || [];
        const index = list.findIndex(t => t.id === id);
        if (index <= 0) return;

        const current = list[index];
        const prev = list[index - 1];

        await apiFetch(`/tasks/${current.id}`, {
            method: "PUT",
            body: JSON.stringify({ ...current, orderIndex: prev.orderIndex })
        });

        await apiFetch(`/tasks/${prev.id}`, {
            method: "PUT",
            body: JSON.stringify({ ...prev, orderIndex: current.orderIndex })
        });

        await loadTasks(lessonId);
    };

    const moveDown = async (lessonId, id) => {
        const list = tasks[lessonId] || [];
        const index = list.findIndex(t => t.id === id);
        if (index === list.length - 1) return;

        const current = list[index];
        const next = list[index + 1];

        await apiFetch(`/tasks/${current.id}`, {
            method: "PUT",
            body: JSON.stringify({ ...current, orderIndex: next.orderIndex })
        });

        await apiFetch(`/tasks/${next.id}`, {
            method: "PUT",
            body: JSON.stringify({ ...next, orderIndex: current.orderIndex })
        });

        await loadTasks(lessonId);
    };

    // =====================
    // UI
    // =====================

    return (
        <div className="max-w-4xl mx-auto text-white space-y-6">

            <h1 className="text-3xl font-bold">📚 Admin Lekcje + Zadania</h1>

            {/* ===== FORM LEKCJI ===== */}
            <div className="bg-gray-800 p-6 rounded space-y-3">

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

                <button
                    onClick={editingId ? update : create}
                    className="bg-green-600 px-4 py-2 rounded"
                >
                    {editingId ? "💾 Zapisz" : "➕ Dodaj lekcję"}
                </button>

            </div>

            {/* ===== LISTA ===== */}
            {lessons.map(l => (
                <div key={l.id} className="bg-gray-800 p-4 rounded space-y-4">

                    <div className="flex justify-between">

                        <div
                            onClick={() => toggleLesson(l.id)}
                            className="cursor-pointer"
                        >
                            {l.orderIndex}. {l.title}
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => startEdit(l)}>✏️</button>
                            <button onClick={() => deleteLesson(l.id)}>🗑</button>
                        </div>

                    </div>

                    {expandedLessonId === l.id && (
                        <div className="bg-gray-900 p-4 rounded space-y-3">

                            {(tasks[l.id] || []).map(t => (
                                <div key={t.id} className="flex justify-between">

                                    <div>
                                        {t.orderIndex}. {t.taskContent}
                                    </div>

                                    <div className="flex gap-2">
                                        <button onClick={() => moveUp(l.id, t.id)}>⬆️</button>
                                        <button onClick={() => moveDown(l.id, t.id)}>⬇️</button>
                                        <button onClick={() => startEditTask(l.id, t)}>✏️</button>
                                        <button onClick={() => deleteTask(l.id, t.id)}>🗑</button>
                                    </div>

                                </div>
                            ))}

                            {/* ===== FORM TASKA ===== */}
                            <div className="bg-gray-800 p-4 rounded space-y-2">

                                <textarea
                                    placeholder="Treść zadania"
                                    value={taskForms[l.id]?.taskContent || ""}
                                    onChange={e => setTaskForms(prev => ({
                                        ...prev,
                                        [l.id]: {
                                            ...prev[l.id],
                                            taskContent: e.target.value
                                        }
                                    }))}
                                    className="w-full p-2 bg-gray-700 rounded"
                                />

                                <input
                                    placeholder="Poprawna odpowiedź"
                                    value={taskForms[l.id]?.expectedAnswer || ""}
                                    onChange={e => setTaskForms(prev => ({
                                        ...prev,
                                        [l.id]: {
                                            ...prev[l.id],
                                            expectedAnswer: e.target.value
                                        }
                                    }))}
                                    className="w-full p-2 bg-gray-700 rounded"
                                />

                                <button
                                    onClick={() =>
                                        editingTaskId[l.id]
                                            ? updateTask(l.id)
                                            : addTask(l.id)
                                    }
                                    className="bg-green-600 px-4 py-2 rounded"
                                >
                                    {editingTaskId[l.id]
                                        ? "💾 Zapisz zadanie"
                                        : "➕ Dodaj zadanie"}
                                </button>

                            </div>

                        </div>
                    )}

                </div>
            ))}

        </div>
    );
}
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../api/api";

export default function AdminLessonPage() {
    const { moduleId } = useParams();

    const [lessons, setLessons] = useState([]);
    const [tasks, setTasks] = useState({});
    const [blocks, setBlocks] = useState({});
    const [expandedLessonId, setExpandedLessonId] = useState(null);

    const emptyLessonForm = {
        title: "",
        theory: "",
        example: "",
        content: "",
        imageUrl: "",
        published: true,
        freePreview: false
    };

    const emptyTaskForm = {
        taskContent: "",
        expectedAnswer: "",
        starterCode: "",
        hint: "",
        language: "java",
        type: "TEXT"
    };

    const [form, setForm] = useState(emptyLessonForm);
    const [editingId, setEditingId] = useState(null);
    const [taskForms, setTaskForms] = useState({});
    const [editingTaskId, setEditingTaskId] = useState({});

    const [moduleSettings, setModuleSettings] = useState({
        name: "",
        lessonsLocked: false
    });

    useEffect(() => {
        loadModule();
        loadLessons();
    }, [moduleId]);

    const loadModule = async () => {
        const data = await apiFetch(`/modules/${moduleId}`);
        setModuleSettings({
            name: data.name || "",
            lessonsLocked: data.lessonsLocked || false
        });
    };

    const loadLessons = async () => {
        const data = await apiFetch(`/lessons/module/${moduleId}`);
        setLessons([...(data || [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)));
    };

    const loadTasks = async (lessonId) => {
        const data = await apiFetch(`/tasks/lesson/${lessonId}`);

        setTasks(prev => ({
            ...prev,
            [lessonId]: [...(data || [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
        }));
    };

    const loadBlocks = async (lessonId) => {
        const data = await apiFetch(`/lesson-blocks/lesson/${lessonId}`);

        setBlocks(prev => ({
            ...prev,
            [lessonId]: [...(data || [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
        }));
    };

    const toggleLesson = (lessonId) => {
        if (expandedLessonId === lessonId) {
            setExpandedLessonId(null);
            return;
        }

        setExpandedLessonId(lessonId);
        loadTasks(lessonId);
        loadBlocks(lessonId);
    };

    const saveModuleSettings = async () => {
        await apiFetch(`/modules/${moduleId}`, {
            method: "PUT",
            body: JSON.stringify(moduleSettings)
        });

        alert("Zapisano ustawienia modułu");
    };

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
        setForm(emptyLessonForm);
    };

    const startEdit = (lesson) => {
        setEditingId(lesson.id);
        setForm(lesson);
    };

    const update = async () => {
        const updated = await apiFetch(`/lessons/${form.id}`, {
            method: "PUT",
            body: JSON.stringify(form)
        });

        setLessons(prev =>
            prev.map(lesson => lesson.id === updated.id ? updated : lesson)
        );

        setEditingId(null);
        setForm(emptyLessonForm);
    };

    const deleteLesson = async (id) => {
        if (!window.confirm("Usunąć lekcję?")) return;

        await apiFetch(`/lessons/${id}`, {
            method: "DELETE"
        });

        setLessons(prev => prev.filter(lesson => lesson.id !== id));
    };

    const addTask = async (lessonId) => {
        const taskForm = taskForms[lessonId] || emptyTaskForm;

        if (!taskForm.taskContent?.trim()) {
            alert("Uzupełnij treść zadania");
            return;
        }

        const task = await apiFetch(`/tasks/lesson/${lessonId}`, {
            method: "POST",
            body: JSON.stringify({
                taskContent: taskForm.taskContent,
                expectedAnswer: taskForm.expectedAnswer || "",
                starterCode: taskForm.starterCode || "",
                hint: taskForm.hint || "",
                language: taskForm.language || "java",
                type: taskForm.type || "TEXT"
            })
        });

        await apiFetch(`/lesson-blocks/lesson/${lessonId}`, {
            method: "POST",
            body: JSON.stringify({
                title: taskForm.taskContent.slice(0, 60),
                type: "TASK",
                content: "",
                taskId: task.id
            })
        });

        await loadTasks(lessonId);
        await loadBlocks(lessonId);

        setTaskForms(prev => ({
            ...prev,
            [lessonId]: emptyTaskForm
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
        const taskForm = taskForms[lessonId];

        if (!taskForm?.id) {
            alert("Nie wybrano zadania do edycji");
            return;
        }

        const updated = await apiFetch(`/tasks/${taskForm.id}`, {
            method: "PUT",
            body: JSON.stringify(taskForm)
        });

        setTasks(prev => ({
            ...prev,
            [lessonId]: (prev[lessonId] || []).map(task =>
                task.id === updated.id ? updated : task
            )
        }));

        setEditingTaskId(prev => ({
            ...prev,
            [lessonId]: null
        }));

        setTaskForms(prev => ({
            ...prev,
            [lessonId]: emptyTaskForm
        }));

        await loadBlocks(lessonId);
    };

    const deleteTask = async (lessonId, taskId) => {
        if (!window.confirm("Usunąć zadanie?")) return;

        await apiFetch(`/tasks/${taskId}`, {
            method: "DELETE"
        });

        await loadTasks(lessonId);
        await loadBlocks(lessonId);
    };

    return (
        <div className="max-w-4xl mx-auto text-white space-y-6">
            <h1 className="text-3xl font-bold">Admin Lekcje + Zadania</h1>

            <div className="bg-gray-800 p-6 rounded space-y-3">
                <input
                    placeholder="Tytuł"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full p-2 bg-gray-700 rounded"
                />

                <textarea
                    placeholder="Teoria"
                    value={form.theory}
                    onChange={e => setForm({ ...form, theory: e.target.value })}
                    className="w-full p-2 bg-gray-700 rounded"
                />

                <textarea
                    placeholder="Przykład"
                    value={form.example}
                    onChange={e => setForm({ ...form, example: e.target.value })}
                    className="w-full p-2 bg-gray-700 rounded"
                />

                <textarea
                    placeholder="Dodatkowa treść / długi opis lekcji"
                    value={form.content || ""}
                    onChange={e => setForm({ ...form, content: e.target.value })}
                    className="w-full p-2 bg-gray-700 rounded min-h-40"
                />

                <input
                    placeholder="URL obrazka lekcji"
                    value={form.imageUrl || ""}
                    onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                    className="w-full p-2 bg-gray-700 rounded"
                />

                <label className="flex items-center gap-2 text-gray-300">
                    <input
                        type="checkbox"
                        checked={form.published || false}
                        onChange={e => setForm({ ...form, published: e.target.checked })}
                    />
                    Opublikowana
                </label>

                <label className="flex items-center gap-2 text-gray-300">
                    <input
                        type="checkbox"
                        checked={form.freePreview || false}
                        onChange={e => setForm({ ...form, freePreview: e.target.checked })}
                    />
                    Darmowy podgląd
                </label>

                <label className="flex items-center gap-2 text-gray-300">
                    <input
                        type="checkbox"
                        checked={moduleSettings.lessonsLocked}
                        onChange={e =>
                            setModuleSettings(prev => ({
                                ...prev,
                                lessonsLocked: e.target.checked
                            }))
                        }
                    />
                    Blokuj lekcje po kolei
                </label>

                <div className="flex gap-2">
                    <button
                        onClick={saveModuleSettings}
                        className="bg-blue-600 px-4 py-2 rounded"
                    >
                        Zapisz ustawienia blokowania
                    </button>

                    <button
                        onClick={editingId ? update : create}
                        className="bg-green-600 px-4 py-2 rounded"
                    >
                        {editingId ? "Zapisz lekcję" : "Dodaj lekcję"}
                    </button>
                </div>
            </div>

            {lessons.map(lesson => (
                <div key={lesson.id} className="bg-gray-800 p-4 rounded space-y-4">
                    <div className="flex justify-between">
                        <div
                            onClick={() => toggleLesson(lesson.id)}
                            className="cursor-pointer"
                        >
                            {lesson.orderIndex}. {lesson.title}
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => startEdit(lesson)}>✏️</button>
                            <button onClick={() => deleteLesson(lesson.id)}>🗑</button>
                        </div>
                    </div>

                    {expandedLessonId === lesson.id && (
                        <div className="bg-gray-900 p-4 rounded space-y-4">
                            <div className="bg-gray-950 p-3 rounded space-y-2">
                                <h3 className="font-bold text-blue-400">Bloki lekcji</h3>

                                {(blocks[lesson.id] || []).length === 0 ? (
                                    <p className="text-gray-500 text-sm">Brak bloków.</p>
                                ) : (
                                    (blocks[lesson.id] || []).map(block => (
                                        <div key={block.id} className="text-sm text-gray-300">
                                            {block.orderIndex}. {block.type} — {block.title}
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="space-y-2">
                                <h3 className="font-bold text-yellow-400">Zadania</h3>

                                {(tasks[lesson.id] || []).map(task => (
                                    <div key={task.id} className="flex justify-between gap-4 bg-gray-800 p-3 rounded">
                                        <div>
                                            {task.orderIndex}. {task.taskContent}
                                        </div>

                                        <div className="flex gap-2 shrink-0">
                                            <button onClick={() => startEditTask(lesson.id, task)}>✏️</button>
                                            <button onClick={() => deleteTask(lesson.id, task.id)}>🗑</button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-gray-800 p-4 rounded space-y-2">
                                <textarea
                                    placeholder="Treść zadania"
                                    value={taskForms[lesson.id]?.taskContent || ""}
                                    onChange={e => setTaskForms(prev => ({
                                        ...prev,
                                        [lesson.id]: {
                                            ...(prev[lesson.id] || emptyTaskForm),
                                            taskContent: e.target.value
                                        }
                                    }))}
                                    className="w-full p-2 bg-gray-700 rounded"
                                />

                                <input
                                    placeholder="Poprawna odpowiedź"
                                    value={taskForms[lesson.id]?.expectedAnswer || ""}
                                    onChange={e => setTaskForms(prev => ({
                                        ...prev,
                                        [lesson.id]: {
                                            ...(prev[lesson.id] || emptyTaskForm),
                                            expectedAnswer: e.target.value
                                        }
                                    }))}
                                    className="w-full p-2 bg-gray-700 rounded"
                                />

                                <select
                                    value={taskForms[lesson.id]?.type || "TEXT"}
                                    onChange={e => setTaskForms(prev => ({
                                        ...prev,
                                        [lesson.id]: {
                                            ...(prev[lesson.id] || emptyTaskForm),
                                            type: e.target.value
                                        }
                                    }))}
                                    className="w-full p-2 bg-gray-700 rounded"
                                >
                                    <option value="TEXT">Zadanie tekstowe</option>
                                    <option value="CODE">Zadanie kodowe</option>
                                </select>

                                <input
                                    placeholder="Język, np. java"
                                    value={taskForms[lesson.id]?.language || "java"}
                                    onChange={e => setTaskForms(prev => ({
                                        ...prev,
                                        [lesson.id]: {
                                            ...(prev[lesson.id] || emptyTaskForm),
                                            language: e.target.value
                                        }
                                    }))}
                                    className="w-full p-2 bg-gray-700 rounded"
                                />

                                <textarea
                                    placeholder="Kod startowy dla ucznia"
                                    value={taskForms[lesson.id]?.starterCode || ""}
                                    onChange={e => setTaskForms(prev => ({
                                        ...prev,
                                        [lesson.id]: {
                                            ...(prev[lesson.id] || emptyTaskForm),
                                            starterCode: e.target.value
                                        }
                                    }))}
                                    className="w-full p-2 bg-gray-700 rounded font-mono min-h-32"
                                />

                                <textarea
                                    placeholder="Podpowiedź"
                                    value={taskForms[lesson.id]?.hint || ""}
                                    onChange={e => setTaskForms(prev => ({
                                        ...prev,
                                        [lesson.id]: {
                                            ...(prev[lesson.id] || emptyTaskForm),
                                            hint: e.target.value
                                        }
                                    }))}
                                    className="w-full p-2 bg-gray-700 rounded"
                                />

                                <button
                                    onClick={() =>
                                        editingTaskId[lesson.id]
                                            ? updateTask(lesson.id)
                                            : addTask(lesson.id)
                                    }
                                    className="bg-green-600 px-4 py-2 rounded"
                                >
                                    {editingTaskId[lesson.id] ? "Zapisz zadanie" : "Dodaj zadanie"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
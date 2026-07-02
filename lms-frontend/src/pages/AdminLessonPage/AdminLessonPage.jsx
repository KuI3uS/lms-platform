import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiFetch } from "../../api/api";

import ModuleSettings from "./ModuleSettings";
import LessonForm from "./LessonForm";

export default function AdminLessonPage() {
    const { moduleId } = useParams();

    const [lessons, setLessons] = useState([]);
    const [form, setForm] = useState({
        title: "",
        theory: "",
        example: "",
        content: "",
        imageUrl: "",
        published: true,
        freePreview: false
    });

    const [editingId, setEditingId] = useState(null);

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

        setLessons(
            [...(data || [])].sort(
                (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
            )
        );
    };

    const saveModuleSettings = async () => {
        await apiFetch(`/modules/${moduleId}`, {
            method: "PUT",
            body: JSON.stringify(moduleSettings)
        });

        alert("Zapisano ustawienia modułu");
    };

    const createLesson = async () => {
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

        setForm({
            title: "",
            theory: "",
            example: "",
            content: "",
            imageUrl: "",
            published: true,
            freePreview: false
        });
    };

    const updateLesson = async () => {
        const updated = await apiFetch(`/lessons/${form.id}`, {
            method: "PUT",
            body: JSON.stringify(form)
        });

        setLessons(prev =>
            prev.map(lesson =>
                lesson.id === updated.id ? updated : lesson
            )
        );

        setEditingId(null);

        setForm({
            title: "",
            theory: "",
            example: "",
            content: "",
            imageUrl: "",
            published: true,
            freePreview: false
        });
    };

    return (
        <div className="max-w-6xl mx-auto text-white space-y-8">

            <div>
                <h1 className="text-4xl font-black">
                    Kreator lekcji
                </h1>

                <p className="text-gray-400 mt-2">
                    Twórz lekcje, bloki teorii, przykłady i zadania praktyczne.
                </p>
            </div>

            <ModuleSettings
                moduleSettings={moduleSettings}
                setModuleSettings={setModuleSettings}
                onSave={saveModuleSettings}
            />

            <LessonForm
                form={form}
                setForm={setForm}
                editingId={editingId}
                onCreate={createLesson}
                onUpdate={updateLesson}
            />

            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
                <h2 className="text-2xl font-bold mb-4">
                    Lekcje w module
                </h2>

                {lessons.length === 0 ? (
                    <p className="text-gray-500">
                        Brak lekcji w tym module.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {lessons.map(lesson => (
                            <div
                                key={lesson.id}

                                className="bg-gray-800 border border-gray-700 rounded-2xl p-4"
                            >
                                {lesson.orderIndex}. {lesson.title}
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}
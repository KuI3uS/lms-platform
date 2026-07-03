import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../../api/api";

const emptyLesson = {
    title: "",
    theory: "",
    example: "",
    content: "",
    imageUrl: "",
    published: true,
    freePreview: false
};

export default function useLessons(moduleId) {

    const [lessons, setLessons] = useState([]);
    const [lessonForm, setLessonForm] = useState(emptyLesson);
    const [editingLessonId, setEditingLessonId] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadLessons = useCallback(async () => {

        if (!moduleId) return;

        try {

            setLoading(true);

            const data = await apiFetch(`/lessons/module/${moduleId}`);

            setLessons(Array.isArray(data) ? data : []);

        } finally {

            setLoading(false);

        }

    }, [moduleId]);

    useEffect(() => {

        loadLessons();

    }, [loadLessons]);

    async function createLesson() {

        if (!lessonForm.title.trim()) {

            alert("Podaj nazwę lekcji.");
            return;

        }

        await apiFetch(`/lessons/module/${moduleId}`, {
            method: "POST",
            body: JSON.stringify({
                ...lessonForm,
                orderIndex: lessons.length + 1
            })
        });

        resetLessonForm();

        await loadLessons();

    }

    async function updateLesson() {

        if (!editingLessonId) return;

        await apiFetch(`/lessons/${editingLessonId}`, {
            method: "PUT",
            body: JSON.stringify(lessonForm)
        });

        resetLessonForm();

        await loadLessons();

    }

    async function deleteLesson(id) {

        if (!window.confirm("Usunąć lekcję?")) {
            return;
        }

        await apiFetch(`/lessons/${id}`, {
            method: "DELETE"
        });

        await loadLessons();

    }

    function editLesson(lesson) {

        setEditingLessonId(lesson.id);

        setLessonForm({
            ...lesson
        });

    }

    function resetLessonForm() {

        setEditingLessonId(null);

        setLessonForm({
            ...emptyLesson
        });

    }

    return {

        loading,

        lessons,
        setLessons,

        lessonForm,
        setLessonForm,

        editingLessonId,

        loadLessons,

        createLesson,
        updateLesson,
        deleteLesson,

        editLesson,
        resetLessonForm

    };

}
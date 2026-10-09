import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../../api/api";
import { useFeedback } from "../../../context/FeedbackContext";
import { cleanChatGptBlock } from "../../../utils/chatGptReferences";

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
    const { confirm, showToast } = useFeedback();

    const [lessons, setLessons] = useState([]);
    const [lessonForm, setLessonForm] = useState(emptyLesson);
    const [editingLessonId, setEditingLessonId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [packageImporting, setPackageImporting] = useState(false);
    const [packageImportProgress, setPackageImportProgress] = useState(null);

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

            showToast("Podaj nazwę lekcji.", "warning");
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

        if (!await confirm({ title: "Usuń lekcję", message: "Usunąć lekcję wraz ze wszystkimi blokami i postępami?", confirmLabel: "Usuń lekcję" })) {
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

    async function importLessonPackage(packageLessons) {
        if (!Array.isArray(packageLessons) || packageLessons.length === 0 || packageImporting) {
            return null;
        }

        const result = {
            lessonsCreated: 0,
            emptyLessonsFilled: 0,
            lessonsSkipped: 0,
            blocksCreated: 0
        };
        const knownLessons = [...lessons];
        let nextOrder = knownLessons.reduce(
            (highest, lesson) => Math.max(highest, Number(lesson.orderIndex) || 0),
            0
        );

        try {
            setPackageImporting(true);

            for (let index = 0; index < packageLessons.length; index += 1) {
                const importedLesson = packageLessons[index];
                const title = String(importedLesson.title || "").trim();
                setPackageImportProgress({
                    current: index + 1,
                    total: packageLessons.length,
                    title
                });

                const titleKey = normalizeLessonTitle(title);
                let targetLesson = knownLessons.find(
                    lesson => normalizeLessonTitle(lesson.title) === titleKey
                );
                let createdNow = false;

                if (targetLesson) {
                    const currentBlocks = await apiFetch(`/lesson-blocks/lesson/${targetLesson.id}`);
                    if (Array.isArray(currentBlocks) && currentBlocks.length > 0) {
                        result.lessonsSkipped += 1;
                        continue;
                    }
                } else {
                    nextOrder += 1;
                    targetLesson = await apiFetch(`/lessons/module/${moduleId}`, {
                        method: "POST",
                        body: JSON.stringify({
                            title,
                            theory: "",
                            example: "",
                            content: "",
                            imageUrl: "",
                            published: false,
                            freePreview: false,
                            orderIndex: nextOrder
                        })
                    });
                    knownLessons.push(targetLesson);
                    createdNow = true;
                    result.lessonsCreated += 1;
                }

                const payload = importedLesson.blocks.map(toLessonBlockRequest);
                await apiFetch(`/lesson-blocks/lesson/${targetLesson.id}/bulk`, {
                    method: "POST",
                    body: JSON.stringify(payload)
                });

                result.blocksCreated += payload.length;
                if (!createdNow) result.emptyLessonsFilled += 1;
            }

            await loadLessons();
            return result;
        } catch (error) {
            try {
                await loadLessons();
            } catch {
                // Pierwotny błąd importu zawiera ważniejszą informację.
            }
            error.packageResult = result;
            throw error;
        } finally {
            setPackageImporting(false);
            setPackageImportProgress(null);
        }
    }

    return {

        loading,
        packageImporting,
        packageImportProgress,

        lessons,
        setLessons,

        lessonForm,
        setLessonForm,

        editingLessonId,

        loadLessons,

        createLesson,
        updateLesson,
        deleteLesson,
        importLessonPackage,

        editLesson,
        resetLessonForm

    };

}

function normalizeLessonTitle(value) {
    return String(value || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLocaleLowerCase("pl-PL");
}

function toLessonBlockRequest(block) {
    const request = cleanChatGptBlock(block);
    delete request.id;
    delete request.lessonId;
    delete request.lesson;
    return request;
}

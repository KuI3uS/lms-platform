import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../../api/api";
import { useFeedback } from "../../../context/FeedbackContext";
import { cleanChatGptBlock } from "../../../utils/chatGptReferences";
import { matchStageLessons } from "../../../utils/stageLessonImport";

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
    const [publishingReady, setPublishingReady] = useState(false);

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
                orderIndex: Math.max(0, ...lessons.map(lesson => Number(lesson.orderIndex) || 0)) + 1
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

    async function importLessonPackage(packageLessons, { publishLessons = true } = {}) {
        if (!Array.isArray(packageLessons) || packageLessons.length === 0 || packageImporting) {
            return null;
        }

        try {
            setPackageImporting(true);
            const freshLessons = await apiFetch(`/lessons/module/${moduleId}`);
            const matched = matchStageLessons(packageLessons, freshLessons);
            if (matched.errors.length) throw new Error(matched.errors.join("\n"));
            setPackageImportProgress({ total: packageLessons.length });
            const result = await apiFetch(`/lesson-blocks/module/${moduleId}/import`, {
                method: "POST",
                body: JSON.stringify({
                    publishLessons,
                    lessons: matched.matches.map(({ source, target }) => ({
                        lessonId: target.id,
                        title: target.title,
                        blocks: source.blocks.map(toLessonBlockRequest)
                    }))
                })
            });
            try { await loadLessons(); }
            catch { showToast("Bloki zostały zapisane. Odśwież stronę, aby zobaczyć aktualne lekcje.", "warning"); }
            return result;
        } catch (error) {
            try {
                await loadLessons();
            } catch {
                // Pierwotny błąd importu zawiera ważniejszą informację.
            }
            throw error;
        } finally {
            setPackageImporting(false);
            setPackageImportProgress(null);
        }
    }

    async function publishReadyLessons() {
        const count = lessons.filter(lesson => !lesson.published && lesson.publishedBlockCount > 0).length;
        if (!count || publishingReady || packageImporting) return;
        if (!await confirm({
            title: "Udostępnij lekcje z materiałami",
            message: `Opublikować ${count} lekcji tego etapu mających już opublikowane bloki? Puste lekcje oraz bloki ukryte pozostaną bez zmian. Dostęp do płatnego kursu nadal wymaga zakupu.`,
            confirmLabel: "Udostępnij uczniom", danger: false
        })) return;
        try {
            setPublishingReady(true);
            const result = await apiFetch(`/lesson-blocks/module/${moduleId}/publish-ready`, { method: "POST" });
            showToast(`Udostępniono ${result.lessonsPublished} lekcji z materiałami.`, "success");
            await loadLessons();
        } catch (error) {
            showToast(error.message || "Nie udało się opublikować lekcji.", "error");
        } finally { setPublishingReady(false); }
    }

    return {

        loading,
        packageImporting,
        packageImportProgress,
        publishingReady,
        publishReadyLessons,

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

function toLessonBlockRequest(block) {
    const request = cleanChatGptBlock(block);
    delete request.id;
    delete request.lessonId;
    delete request.lesson;
    return request;
}

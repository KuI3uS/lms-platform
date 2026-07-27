import { useState } from "react";
import { apiFetch } from "../../../api/api";

const emptyBlock = {
    id: null,

    title: "",
    type: "TEXT",

    content: "",
    description: "",
    instruction: "",

    starterCode: "",
    expectedAnswer: "",
    hint: "",
    detailedHint: "",
    solutionExplanation: "",

    language: "java",

    mediaUrl: "",
    mediaType: "",

    published: true,
    points: 0,
    orderIndex: 0
};

export default function useLessonBlocks() {

    const [blocksByLesson, setBlocksByLesson] = useState({});

    const [blockForms, setBlockForms] = useState({});
    const [savingByLesson, setSavingByLesson] = useState({});
    const [errorsByLesson, setErrorsByLesson] = useState({});

    async function loadBlocks(lessonId) {

        const data = await apiFetch(
            `/lesson-blocks/lesson/${lessonId}`
        );

        setBlocksByLesson(prev => ({
            ...prev,
            [lessonId]: data || []
        }));

        if (!blockForms[lessonId]) {

            resetBlockForm(lessonId);

        }

    }

    async function saveBlock(lessonId) {

        const block = blockForms[lessonId];

        if (!block) {
            return;
        }

        if (!validateBlock(block)) return;

        try {
            setSaving(lessonId, true);
            clearError(lessonId);
            const saved = await apiFetch(
                `/lesson-blocks/lesson/${lessonId}`,
                {
                    method: "POST",
                    body: JSON.stringify(toRequest(block))
                }
            );

            setBlocksByLesson(prev => ({
                ...prev,
                [lessonId]: [...(prev[lessonId] || []), saved]
            }));
            resetBlockForm(lessonId);
        } catch (error) {
            setError(lessonId, error);
        } finally {
            setSaving(lessonId, false);
        }

    }

    async function updateBlock(
        lessonId,
        blockId
    ) {

        const block = blockForms[lessonId];

        if (!block) {
            return;
        }

        if (!validateBlock(block)) return;

        try {
            setSaving(lessonId, true);
            clearError(lessonId);
            const saved = await apiFetch(
                `/lesson-blocks/${blockId}`,
                {
                    method: "PUT",
                    body: JSON.stringify(toRequest(block))
                }
            );

            setBlocksByLesson(prev => ({
                ...prev,
                [lessonId]: (prev[lessonId] || []).map(item =>
                    item.id === blockId ? saved : item
                )
            }));
            resetBlockForm(lessonId);
        } catch (error) {
            setError(lessonId, error);
        } finally {
            setSaving(lessonId, false);
        }

    }

    async function deleteBlock(
        lessonId,
        blockId
    ) {

        if (!window.confirm("Usunąć blok?")) {
            return;
        }

        await apiFetch(
            `/lesson-blocks/${blockId}`,
            {
                method: "DELETE"
            }
        );

        await loadBlocks(lessonId);

    }

    function editBlock(
        lessonId,
        block
    ) {

        setBlockForms(prev => ({
            ...prev,
            [lessonId]: {
                ...block
            }
        }));

    }

    function resetBlockForm(lessonId) {

        setBlockForms(prev => ({
            ...prev,
            [lessonId]: {
                ...emptyBlock
            }
        }));

    }

    function setBlock(lessonId, callback) {

        setBlockForms(prev => ({

            ...prev,

            [lessonId]:

                typeof callback === "function"

                    ? callback(
                        prev[lessonId] || { ...emptyBlock }
                    )

                    : callback

        }));

    }

    function getBlocks(lessonId) {

        return blocksByLesson[lessonId] || [];

    }

    function getBlockForm(lessonId) {
        return blockForms[lessonId] || { ...emptyBlock };
    }

    function validateBlock(block) {
        if (block.type !== "DIVIDER" && !block.title?.trim()) {
            alert("Podaj tytuł bloku.");
            return false;
        }

        if (["TEXT", "TIP", "WARNING", "INFO", "SUMMARY", "QUOTE", "EXAMPLE"]
            .includes(block.type) && !block.content?.trim()) {
            alert("Uzupełnij treść tego bloku.");
            return false;
        }

        if (["IMAGE", "VIDEO", "PDF", "DOWNLOAD"].includes(block.type)
            && !block.mediaUrl?.trim()) {
            alert("Podaj prawidłowy adres materiału.");
            return false;
        }

        if (block.type === "QUIZ") {
            const options = (block.content || "")
                .split("\n")
                .map(option => option.trim())
                .filter(Boolean);

            if (options.length < 2) {
                alert("Quiz wymaga przynajmniej dwóch odpowiedzi.");
                return false;
            }
            if (!block.expectedAnswer
                || !options.includes(block.expectedAnswer)) {
                alert("Wybierz poprawną odpowiedź quizu.");
                return false;
            }
        }

        if (block.type === "TASK") {
            if (!block.instruction?.trim()) {
                alert("Dodaj polecenie do zadania.");
                return false;
            }
            if (!block.expectedAnswer?.trim()) {
                alert("Dodaj poprawną odpowiedź do zadania.");
                return false;
            }
        }

        return true;
    }

    function toRequest(block) {
        const request = { ...block };
        delete request.id;
        delete request.lessonId;
        delete request.lesson;
        return request;
    }

    function setSaving(lessonId, saving) {
        setSavingByLesson(prev => ({ ...prev, [lessonId]: saving }));
    }

    function setError(lessonId, error) {
        setErrorsByLesson(prev => ({
            ...prev,
            [lessonId]: error?.message || "Nie udało się zapisać bloku."
        }));
    }

    function clearError(lessonId) {
        setErrorsByLesson(prev => ({ ...prev, [lessonId]: "" }));
    }

    return {

        blocksByLesson,

        blockForms,
        savingByLesson,
        errorsByLesson,

        emptyBlock,

        loadBlocks,

        saveBlock,

        updateBlock,

        deleteBlock,

        editBlock,

        resetBlockForm,

        setBlock,

        getBlocks,

        getBlockForm

    };

}

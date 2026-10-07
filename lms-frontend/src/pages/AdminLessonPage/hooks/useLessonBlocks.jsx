import { useState } from "react";
import { apiFetch } from "../../../api/api";
import { useFeedback } from "../../../context/FeedbackContext";

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
    hiddenTests: "",

    language: "java",

    mediaUrl: "",
    mediaType: "",

    published: true,
    points: 0,
    orderIndex: 0
};

export default function useLessonBlocks() {
    const { confirm, showToast } = useFeedback();

    const [blocksByLesson, setBlocksByLesson] = useState({});

    const [blockForms, setBlockForms] = useState({});
    const [savingByLesson, setSavingByLesson] = useState({});
    const [importingByLesson, setImportingByLesson] = useState({});
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

    async function importBlocks(lessonId, blocks) {
        if (!Array.isArray(blocks) || blocks.length === 0) return false;

        try {
            setImportingByLesson(prev => ({ ...prev, [lessonId]: true }));
            clearError(lessonId);
            const saved = await apiFetch(
                `/lesson-blocks/lesson/${lessonId}/bulk`,
                {
                    method: "POST",
                    body: JSON.stringify(blocks.map(toRequest))
                }
            );
            setBlocksByLesson(prev => ({
                ...prev,
                [lessonId]: [...(prev[lessonId] || []), ...(saved || [])]
            }));
            showToast(
                `Zaimportowano ${saved?.length || blocks.length} bloków lekcji.`,
                "success"
            );
            return true;
        } catch (error) {
            setError(lessonId, error);
            showToast("Nie udało się zaimportować lekcji. Sprawdź wskazane pola.", "error");
            return false;
        } finally {
            setImportingByLesson(prev => ({ ...prev, [lessonId]: false }));
        }
    }

    async function deleteBlock(
        lessonId,
        blockId
    ) {

        if (!await confirm({ title: "Usuń blok", message: "Usunąć ten element lekcji?", confirmLabel: "Usuń blok" })) {
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
            showToast("Podaj tytuł bloku.", "warning");
            return false;
        }

        if (["TEXT", "TIP", "WARNING", "INFO", "SUMMARY", "QUOTE", "EXAMPLE"]
            .includes(block.type) && !block.content?.trim()) {
            showToast("Uzupełnij treść tego bloku.", "warning");
            return false;
        }

        if (["IMAGE", "VIDEO", "PDF", "DOWNLOAD"].includes(block.type)
            && !block.mediaUrl?.trim()) {
            showToast("Podaj prawidłowy adres materiału.", "warning");
            return false;
        }

        if (block.type === "AUDIO" && !block.content?.trim()) {
            showToast("Dodaj zwrot, który uczeń ma powtórzyć.", "warning");
            return false;
        }

        if (block.type === "QUIZ") {
            const options = (block.content || "")
                .split("\n")
                .map(option => option.trim())
                .filter(Boolean);

            if (options.length < 2) {
                showToast("Quiz wymaga przynajmniej dwóch odpowiedzi.", "warning");
                return false;
            }
            if (!block.expectedAnswer
                || !options.includes(block.expectedAnswer)) {
                showToast("Wybierz poprawną odpowiedź quizu.", "warning");
                return false;
            }
        }

        if (block.type === "TASK") {
            if (!block.instruction?.trim()) {
                showToast("Dodaj polecenie do zadania.", "warning");
                return false;
            }
            if (!block.expectedAnswer?.trim()) {
                showToast("Dodaj poprawną odpowiedź do zadania.", "warning");
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
        importingByLesson,
        errorsByLesson,

        emptyBlock,

        loadBlocks,

        saveBlock,

        updateBlock,

        importBlocks,

        deleteBlock,

        editBlock,

        resetBlockForm,

        setBlock,

        getBlocks,

        getBlockForm

    };

}

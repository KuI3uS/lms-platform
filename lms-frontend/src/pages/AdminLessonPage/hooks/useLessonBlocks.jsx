import { useState } from "react";
import { apiFetch } from "../../../api/api";
import { useFeedback } from "../../../context/FeedbackContext";

import {
    getLessonBlockLimit
} from "../../../utils/lessonBlockLimits";

import {
    parseDialogContent,
    parseVocabularyContent
} from "../../../utils/languageInteractiveBlocks";
import { parseSentenceBuilderContent } from "../../../utils/sentenceBuilder";


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


/**
 * Pozwala zachować kompatybilność.
 *
 * Można przekazać:
 *
 * "LANGUAGE"
 * "PROGRAMMING"
 * 10
 * 20
 *
 * Dzięki temu stare wywołania przekazujące liczbę
 * nie przestaną działać.
 */
function resolveBlockLimit(variantOrLimit = "PROGRAMMING") {
    if (
        typeof variantOrLimit === "number"
        && Number.isFinite(variantOrLimit)
    ) {
        return variantOrLimit;
    }

    return getLessonBlockLimit(variantOrLimit);
}


export default function useLessonBlocks() {

    const {
        confirm,
        showToast
    } = useFeedback();


    const [
        blocksByLesson,
        setBlocksByLesson
    ] = useState({});


    const [
        blockForms,
        setBlockForms
    ] = useState({});


    const [
        savingByLesson,
        setSavingByLesson
    ] = useState({});


    const [
        importingByLesson,
        setImportingByLesson
    ] = useState({});


    const [
        deletingAllByLesson,
        setDeletingAllByLesson
    ] = useState({});


    const [
        errorsByLesson,
        setErrorsByLesson
    ] = useState({});


    /**
     * Pobieranie wszystkich bloków lekcji.
     */
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


    /**
     * Dodanie pojedynczego bloku.
     *
     * Trzeci parametr:
     *
     * LANGUAGE -> limit 20
     * PROGRAMMING -> limit 10
     *
     * Można też przekazać bezpośrednio liczbę.
     */
    async function saveBlock(
        lessonId,
        variantOrLimit = "PROGRAMMING"
    ) {

        const maxBlocks = resolveBlockLimit(
            variantOrLimit
        );

        const block = blockForms[lessonId];

        if (!block) {
            return false;
        }


        if (!validateBlock(block)) {
            return false;
        }


        if (
            getBlocks(lessonId).length
            >= maxBlocks
        ) {

            const message =
                `Jedna lekcja może zawierać maksymalnie ${maxBlocks} bloków.`;

            showToast(
                message,
                "warning"
            );

            setErrorsByLesson(prev => ({
                ...prev,
                [lessonId]: message
            }));

            return false;
        }


        try {

            setSaving(
                lessonId,
                true
            );

            clearError(
                lessonId
            );


            const saved = await apiFetch(
                `/lesson-blocks/lesson/${lessonId}`,
                {
                    method: "POST",
                    body: JSON.stringify(
                        toRequest(block)
                    )
                }
            );


            setBlocksByLesson(prev => ({
                ...prev,

                [lessonId]: [
                    ...(prev[lessonId] || []),
                    saved
                ]
            }));


            resetBlockForm(
                lessonId
            );


            return true;

        } catch (error) {

            setError(
                lessonId,
                error
            );

            showToast(
                `Nie udało się zapisać bloku: ${error?.message || "nieznany błąd"}`,
                "error"
            );

            return false;

        } finally {

            setSaving(
                lessonId,
                false
            );
        }
    }


    /**
     * Aktualizacja pojedynczego bloku.
     */
    async function updateBlock(
        lessonId,
        blockId
    ) {

        const block = blockForms[lessonId];

        if (!block) {
            return false;
        }


        if (!validateBlock(block)) {
            return false;
        }


        try {

            setSaving(
                lessonId,
                true
            );

            clearError(
                lessonId
            );


            const saved = await apiFetch(
                `/lesson-blocks/${blockId}`,
                {
                    method: "PUT",
                    body: JSON.stringify(
                        toRequest(block)
                    )
                }
            );


            setBlocksByLesson(prev => ({
                ...prev,

                [lessonId]:
                    (prev[lessonId] || [])
                        .map(item =>
                            item.id === blockId
                                ? saved
                                : item
                        )
            }));


            resetBlockForm(
                lessonId
            );


            return true;

        } catch (error) {

            setError(
                lessonId,
                error
            );

            showToast(
                `Nie udało się zapisać zmian: ${error?.message || "nieznany błąd"}`,
                "error"
            );

            return false;

        } finally {

            setSaving(
                lessonId,
                false
            );
        }
    }


    /**
     * Import wielu bloków.
     *
     * Dla kursu językowego wywołuj:
     *
     * importBlocks(
     *     lesson.id,
     *     parsedBlocks,
     *     "LANGUAGE"
     * )
     */
    async function importBlocks(
        lessonId,
        blocks,
        variantOrLimit = "PROGRAMMING"
    ) {

        if (
            !Array.isArray(blocks)
            || blocks.length === 0
        ) {
            return false;
        }


        const maxBlocks = resolveBlockLimit(
            variantOrLimit
        );


        const currentCount =
            getBlocks(lessonId).length;


        if (
            currentCount + blocks.length
            > maxBlocks
        ) {

            const remaining = Math.max(
                0,
                maxBlocks - currentCount
            );


            const message =
                remaining > 0
                    ? `W tej lekcji zostało miejsce na ${remaining} ${remaining === 1 ? "blok" : "bloki"}.`
                    : `Ta lekcja ma już maksymalną liczbę ${maxBlocks} bloków.`;


            setErrorsByLesson(prev => ({
                ...prev,
                [lessonId]: message
            }));


            showToast(
                message,
                "warning"
            );


            return false;
        }


        /**
         * Walidujemy każdy blok PRZED wysłaniem
         * całej paczki do backendu.
         *
         * Dzięki temu błędny Dialog / Vocabulary
         * nie kończy się anonimowym HTTP 400.
         */
        for (
            let index = 0;
            index < blocks.length;
            index += 1
        ) {

            const block = blocks[index];

            if (!validateBlock(block)) {

                const message =
                    `Nie można zaimportować bloku ${index + 1}. Sprawdź jego konfigurację.`;


                setErrorsByLesson(prev => ({
                    ...prev,
                    [lessonId]: message
                }));


                showToast(
                    message,
                    "error"
                );


                return false;
            }
        }


        try {

            setImportingByLesson(prev => ({
                ...prev,
                [lessonId]: true
            }));


            clearError(
                lessonId
            );


            const payload =
                blocks.map(toRequest);


            const saved = await apiFetch(
                `/lesson-blocks/lesson/${lessonId}/bulk`,
                {
                    method: "POST",
                    body: JSON.stringify(
                        payload
                    )
                }
            );


            setBlocksByLesson(prev => ({
                ...prev,

                [lessonId]: [
                    ...(prev[lessonId] || []),
                    ...(saved || [])
                ]
            }));


            showToast(
                `Zaimportowano ${saved?.length || blocks.length} bloków lekcji.`,
                "success"
            );


            return true;

        } catch (error) {

            console.error(
                "Błąd importu bloków:",
                error
            );


            setError(
                lessonId,
                error
            );


            showToast(
                `Nie udało się zaimportować lekcji: ${error?.message || "nieznany błąd"}`,
                "error"
            );


            return false;

        } finally {

            setImportingByLesson(prev => ({
                ...prev,
                [lessonId]: false
            }));
        }
    }


    /**
     * Zastąpienie całej lekcji nowymi blokami.
     */
    async function replaceBlocks(
        lessonId,
        blocks,
        variantOrLimit = "PROGRAMMING"
    ) {

        if (
            !Array.isArray(blocks)
            || blocks.length === 0
        ) {
            return false;
        }


        const maxBlocks = resolveBlockLimit(
            variantOrLimit
        );


        if (
            blocks.length
            > maxBlocks
        ) {

            const message =
                `Jedna lekcja może zawierać maksymalnie ${maxBlocks} bloków.`;


            setErrorsByLesson(prev => ({
                ...prev,
                [lessonId]: message
            }));


            showToast(
                message,
                "warning"
            );


            return false;
        }


        /**
         * Walidacja bloków przed wysłaniem.
         */
        for (
            let index = 0;
            index < blocks.length;
            index += 1
        ) {

            if (!validateBlock(blocks[index])) {

                const message =
                    `Nie można zapisać bloku ${index + 1}. Sprawdź jego konfigurację.`;


                setErrorsByLesson(prev => ({
                    ...prev,
                    [lessonId]: message
                }));


                showToast(
                    message,
                    "error"
                );


                return false;
            }
        }


        const currentCount =
            getBlocks(lessonId).length;


        const accepted = await confirm({
            title: "Zastąp całą treść lekcji",

            message:
                `Usunąć ${currentCount} ${
                    currentCount === 1
                        ? "istniejący blok"
                        : "istniejących bloków"
                } i zastąpić je ${blocks.length} nowymi? `
                + "Znikną również zapisane próby odpowiedzi dotyczące obecnych zadań i quizów.",

            confirmLabel: "Zastąp bloki"
        });


        if (!accepted) {
            return false;
        }


        try {

            setImportingByLesson(prev => ({
                ...prev,
                [lessonId]: true
            }));


            clearError(
                lessonId
            );


            const payload =
                blocks.map(toRequest);


            const saved = await apiFetch(
                `/lesson-blocks/lesson/${lessonId}/replace`,
                {
                    method: "PUT",
                    body: JSON.stringify(
                        payload
                    )
                }
            );


            setBlocksByLesson(prev => ({
                ...prev,
                [lessonId]: saved || []
            }));


            resetBlockForm(
                lessonId
            );


            showToast(
                `Zastąpiono treść lekcji. Zapisano ${saved?.length || blocks.length} bloków.`,
                "success"
            );


            return true;

        } catch (error) {

            console.error(
                "Błąd zastępowania bloków:",
                error
            );


            setError(
                lessonId,
                error
            );


            showToast(
                `Nie udało się zastąpić treści lekcji: ${error?.message || "nieznany błąd"}`,
                "error"
            );


            return false;

        } finally {

            setImportingByLesson(prev => ({
                ...prev,
                [lessonId]: false
            }));
        }
    }


    /**
     * Usunięcie pojedynczego bloku.
     */
    async function deleteBlock(
        lessonId,
        blockId
    ) {

        const accepted = await confirm({
            title: "Usuń blok",
            message: "Usunąć ten element lekcji?",
            confirmLabel: "Usuń blok"
        });


        if (!accepted) {
            return;
        }


        try {

            await apiFetch(
                `/lesson-blocks/${blockId}`,
                {
                    method: "DELETE"
                }
            );


            await loadBlocks(
                lessonId
            );

        } catch (error) {

            setError(
                lessonId,
                error
            );


            showToast(
                `Nie udało się usunąć bloku: ${error?.message || "nieznany błąd"}`,
                "error"
            );
        }
    }


    /**
     * Usunięcie wszystkich bloków lekcji.
     */
    async function deleteAllBlocks(
        lessonId
    ) {

        const blockCount =
            getBlocks(lessonId).length;


        if (blockCount === 0) {
            return;
        }


        const accepted = await confirm({
            title: "Usuń wszystkie bloki lekcji",

            message:
                `Trwale usunąć ${blockCount} ${
                    blockCount === 1
                        ? "blok"
                        : "bloków"
                } z tej lekcji? `
                + "Znikną również zapisane próby odpowiedzi dotyczące tych zadań i quizów.",

            confirmLabel: "Usuń wszystkie"
        });


        if (!accepted) {
            return;
        }


        try {

            setDeletingAllByLesson(prev => ({
                ...prev,
                [lessonId]: true
            }));


            clearError(
                lessonId
            );


            await apiFetch(
                `/lesson-blocks/lesson/${lessonId}`,
                {
                    method: "DELETE"
                }
            );


            setBlocksByLesson(prev => ({
                ...prev,
                [lessonId]: []
            }));


            resetBlockForm(
                lessonId
            );


            showToast(
                `Usunięto wszystkie bloki tej lekcji (${blockCount}).`,
                "success"
            );

        } catch (error) {

            setError(
                lessonId,
                error
            );


            showToast(
                `Nie udało się usunąć bloków lekcji: ${error?.message || "nieznany błąd"}`,
                "error"
            );

        } finally {

            setDeletingAllByLesson(prev => ({
                ...prev,
                [lessonId]: false
            }));
        }
    }


    /**
     * Rozpoczęcie edycji bloku.
     */
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


    /**
     * Reset formularza bloku.
     */
    function resetBlockForm(
        lessonId
    ) {

        setBlockForms(prev => ({
            ...prev,

            [lessonId]: {
                ...emptyBlock
            }
        }));
    }


    /**
     * Aktualizacja formularza bloku.
     */
    function setBlock(
        lessonId,
        callback
    ) {

        setBlockForms(prev => ({
            ...prev,

            [lessonId]:
                typeof callback === "function"
                    ? callback(
                        prev[lessonId]
                        || { ...emptyBlock }
                    )
                    : callback
        }));
    }


    /**
     * Pobiera zapisane bloki lekcji.
     */
    function getBlocks(
        lessonId
    ) {

        return (
            blocksByLesson[lessonId]
            || []
        );
    }


    /**
     * Pobiera formularz bieżącego bloku.
     */
    function getBlockForm(
        lessonId
    ) {

        return (
            blockForms[lessonId]
            || { ...emptyBlock }
        );
    }


    /**
     * Walidacja pojedynczego bloku.
     */
    function validateBlock(block) {

        if (
            block.type !== "DIVIDER"
            && !block.title?.trim()
        ) {

            showToast(
                "Podaj tytuł bloku.",
                "warning"
            );

            return false;
        }


        if (
            [
                "TEXT",
                "TIP",
                "WARNING",
                "INFO",
                "SUMMARY",
                "QUOTE",
                "EXAMPLE"
            ].includes(block.type)
            && !block.content?.trim()
        ) {

            showToast(
                "Uzupełnij treść tego bloku.",
                "warning"
            );

            return false;
        }


        if (
            [
                "IMAGE",
                "VIDEO",
                "PDF",
                "DOWNLOAD"
            ].includes(block.type)
            && !block.mediaUrl?.trim()
        ) {

            showToast(
                "Podaj prawidłowy adres materiału.",
                "warning"
            );

            return false;
        }


        if (
            block.type === "AUDIO"
            && !block.content?.trim()
        ) {

            showToast(
                "Dodaj zwrot, który uczeń ma powtórzyć.",
                "warning"
            );

            return false;
        }


        /**
         * Dialog interaktywny.
         */
        if (block.type === "DIALOG") {
            const dialog = parseDialogContent(block.content);

            const characters = Array.isArray(dialog?.characters)
                ? dialog.characters
                : [];

            const turns = Array.isArray(dialog?.turns)
                ? dialog.turns
                : [];

            if (
                characters.length < 2
                || !characters[0]?.name?.trim()
                || !characters[1]?.name?.trim()
            ) {
                showToast(
                    "Dialog wymaga dwóch bohaterów.",
                    "warning"
                );
                return false;
            }

            const studentCharacterId =
                dialog?.studentCharacterId != null
                    ? String(dialog.studentCharacterId)
                    : "";

            const studentCharacterExists =
                characters.some(
                    character =>
                        String(character?.id ?? "")
                        === studentCharacterId
                );

            if (
                !studentCharacterId
                || !studentCharacterExists
            ) {
                console.error(
                    "BŁĘDNA ROLA UCZNIA:",
                    {
                        studentCharacterId:
                        dialog?.studentCharacterId,

                        characters:
                            characters.map(character => ({
                                id: character.id,
                                name: character.name
                            })),

                        dialog
                    }
                );

                showToast(
                    "Wybierz postać, w którą wciela się uczeń.",
                    "warning"
                );

                return false;
            }

            if (turns.length < 2) {
                showToast(
                    "Dialog wymaga przynajmniej dwóch wypowiedzi.",
                    "warning"
                );
                return false;
            }
        }

        if (block.type === "WORD_LAB") {
            const vocabulary = parseVocabularyContent(block.content);
            if (vocabulary.items.length < 1 || vocabulary.items.length > 20) {
                showToast("Laboratorium słów musi zawierać od 1 do 20 pozycji.", "warning");
                return false;
            }
        }

        /**
         * Trening słówek.
         */
        if (
            block.type === "VOCABULARY"
        ) {

            const vocabulary =
                parseVocabularyContent(
                    block.content
                );


            if (
                vocabulary.items.length < 1
                || vocabulary.items.some(
                    item =>
                        !item.term
                        || !item.translation
                )
            ) {

                showToast(
                    "Dodaj przynajmniej jedno słówko wraz z tłumaczeniem.",
                    "warning"
                );

                return false;
            }


            if (
                vocabulary.items.length > 20
            ) {

                showToast(
                    "Jeden trening może zawierać maksymalnie 20 słówek.",
                    "warning"
                );

                return false;
            }
        }

        if (block.type === "SENTENCE_BUILDER") {
            const sentence = parseSentenceBuilderContent(block.content);
            if (!sentence.polishSentence) {
                showToast("Dodaj polskie zdanie do przetłumaczenia.", "warning");
                return false;
            }
            if (sentence.words.length < 2 || sentence.words.length > 6) {
                showToast("Zdanie angielskie musi zawierać od 2 do 6 kafelków.", "warning");
                return false;
            }
        }


        /**
         * Quiz.
         */
        if (
            block.type === "QUIZ"
        ) {

            const options =
                (block.content || "")
                    .split("\n")
                    .map(
                        option =>
                            option.trim()
                    )
                    .filter(Boolean);


            if (
                options.length < 2
            ) {

                showToast(
                    "Quiz wymaga przynajmniej dwóch odpowiedzi.",
                    "warning"
                );

                return false;
            }


            if (
                !block.expectedAnswer
                || !options.includes(
                    block.expectedAnswer
                )
            ) {

                showToast(
                    "Wybierz poprawną odpowiedź quizu.",
                    "warning"
                );

                return false;
            }
        }


        /**
         * Zadanie.
         */
        if (
            block.type === "TASK"
        ) {

            if (
                !block.instruction?.trim()
            ) {

                showToast(
                    "Dodaj polecenie do zadania.",
                    "warning"
                );

                return false;
            }


            if (
                !block.expectedAnswer?.trim()
            ) {

                showToast(
                    "Dodaj poprawną odpowiedź do zadania.",
                    "warning"
                );

                return false;
            }
        }


        return true;
    }


    /**
     * Przygotowanie obiektu wysyłanego do API.
     */
    function toRequest(block) {

        const request = {
            ...block
        };


        delete request.id;
        delete request.lessonId;
        delete request.lesson;


        return request;
    }


    function setSaving(
        lessonId,
        saving
    ) {

        setSavingByLesson(prev => ({
            ...prev,
            [lessonId]: saving
        }));
    }


    function setError(
        lessonId,
        error
    ) {

        setErrorsByLesson(prev => ({
            ...prev,

            [lessonId]:
                error?.message
                || "Nie udało się zapisać bloku."
        }));
    }


    function clearError(
        lessonId
    ) {

        setErrorsByLesson(prev => ({
            ...prev,
            [lessonId]: ""
        }));
    }


    return {

        blocksByLesson,

        blockForms,

        savingByLesson,

        importingByLesson,

        deletingAllByLesson,

        errorsByLesson,

        emptyBlock,

        loadBlocks,

        saveBlock,

        updateBlock,

        importBlocks,

        replaceBlocks,

        deleteBlock,

        deleteAllBlocks,

        editBlock,

        resetBlockForm,

        setBlock,

        getBlocks,

        getBlockForm
    };
}

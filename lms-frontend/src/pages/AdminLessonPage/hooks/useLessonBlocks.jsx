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

        if (
            block.type !== "DIVIDER" &&
            !block.title?.trim()
        ) {

            alert("Podaj tytuł bloku.");

            return;

        }

        await apiFetch(
            `/lesson-blocks/lesson/${lessonId}`,
            {
                method: "POST",
                body: JSON.stringify(block)
            }
        );

        await loadBlocks(lessonId);

        resetBlockForm(lessonId);

    }

    async function updateBlock(
        lessonId,
        blockId
    ) {

        const block = blockForms[lessonId];

        if (!block) {
            return;
        }

        await apiFetch(
            `/lesson-blocks/${blockId}`,
            {
                method: "PUT",
                body: JSON.stringify(block)
            }
        );

        await loadBlocks(lessonId);

        resetBlockForm(lessonId);

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

    return {

        blocksByLesson,

        blockForms,

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
import { useState } from "react";

export default function useExpandedLesson() {

    const [expandedLessonId, setExpandedLessonId] = useState(null);

    function isExpanded(lessonId) {

        return expandedLessonId === lessonId;

    }

    function collapse() {

        setExpandedLessonId(null);

    }

    function expand(lessonId) {

        setExpandedLessonId(lessonId);

    }

    async function toggle(
        lessonId,
        lessonBlocks,
        lessonTasks
    ) {

        if (expandedLessonId === lessonId) {

            collapse();

            return;

        }

        expand(lessonId);

        if (
            lessonBlocks &&
            lessonBlocks.getBlocks(lessonId).length === 0
        ) {

            await lessonBlocks.loadBlocks(lessonId);

        }

        if (
            lessonTasks &&
            lessonTasks.getTasks(lessonId).length === 0
        ) {

            await lessonTasks.loadTasks(lessonId);

        }

    }

    return {

        expandedLessonId,

        isExpanded,

        expand,

        collapse,

        toggle

    };

}
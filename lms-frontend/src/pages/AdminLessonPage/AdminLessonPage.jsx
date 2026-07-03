import { useParams } from "react-router-dom";
import { useEffect } from "react";

import LessonForm from "./LessonForm";
import LessonCard from "./LessonCard";

import useLessons from "./hooks/useLessons.jsx";
import useLessonBlocks from "./hooks/useLessonBlocks.jsx";
import useLessonTasks from "./hooks/useLessonTasks.jsx";
import useExpandedLesson from "./hooks/useExpandedLesson.jsx";

export default function AdminLessonPage() {

    const { moduleId } = useParams();
    const lessons = useLessons(moduleId);

    const lessonBlocks = useLessonBlocks();
    const lessonTasks = useLessonTasks();

    const expanded = useExpandedLesson();

    console.log(moduleId);

    useEffect(() => {

        if (moduleId) {
            lessons.loadLessons();
        }

    }, [moduleId]);

    async function handleToggleLesson(lessonId) {

        if (expanded.isExpanded(lessonId)) {

            expanded.collapse();
            return;

        }

        expanded.expand(lessonId);

        await Promise.all([
            lessonBlocks.loadBlocks(lessonId),
            lessonTasks.loadTasks(lessonId)
        ]);

    }

    return (

        <div className="space-y-8">

            <LessonForm
                form={lessons.lessonForm}
                setForm={lessons.setLessonForm}
                editingId={lessons.editingLessonId}
                onCreate={lessons.createLesson}
                onUpdate={lessons.updateLesson}
            />
            <div className="space-y-6">

                {lessons.lessons.map((lesson) => (

                    <LessonCard
                        key={lesson.id}
                        lesson={lesson}

                        expanded={expanded.isExpanded(lesson.id)}
                        toggle={handleToggleLesson}

                        onEdit={lessons.editLesson}
                        onDelete={lessons.deleteLesson}

                        lessonBlocks={lessonBlocks}
                        lessonTasks={lessonTasks}
                    />

                ))}

            </div>

        </div>

    );

}
import { useEffect } from "react";

import LessonForm from "./LessonForm";
import LessonCard from "./LessonCard";

import useLessons from "./hooks/useLessons";
import useLessonBlocks from "./hooks/useLessonBlocks";
import useLessonTasks from "./hooks/useLessonTasks";
import useExpandedLesson from "./hooks/useExpandedLesson";

export default function AdminLessonPage({ moduleId }) {

    const lessons = useLessons(moduleId);

    const lessonBlocks = useLessonBlocks();

    const lessonTasks = useLessonTasks();

    const expanded = useExpandedLesson();

    useEffect(() => {

        if (moduleId) {

            lessons.loadLessons();

        }

    }, [moduleId]);

    return (

        <div className="space-y-8">

            <LessonForm
                lesson={lessons.lesson}
                setLesson={lessons.setLesson}
                onSave={
                    lessons.lesson.id
                        ? lessons.updateLesson
                        : lessons.createLesson
                }
            />

            <div className="space-y-6">

                {lessons.lessons.map((lesson) => (

                    <LessonCard
                        key={lesson.id}

                        lesson={lesson}

                        expanded={expanded.isExpanded(lesson.id)}

                        toggle={(lessonId) =>
                            expanded.toggle(
                                lessonId,
                                lessonBlocks,
                                lessonTasks
                            )
                        }

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
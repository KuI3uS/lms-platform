import { useParams } from "react-router-dom";

import LessonForm from "./LessonForm";
import LessonCard from "./LessonCard";

import useLessons from "./hooks/useLessons";
import useLessonBlocks from "./hooks/useLessonBlocks";
import useLessonTasks from "./hooks/useLessonTasks";
import useExpandedLesson from "./hooks/useExpandedLesson";

export default function AdminLessonPage() {

    const { moduleId } = useParams();

    const lessons = useLessons(moduleId);
    const lessonBlocks = useLessonBlocks();
    const lessonTasks = useLessonTasks();
    const expanded = useExpandedLesson();

    return (

        <div className="space-y-10">

            <LessonForm
                form={lessons.lessonForm}
                setForm={lessons.setLessonForm}
                editingId={lessons.editingLessonId}
                onCreate={lessons.createLesson}
                onUpdate={lessons.updateLesson}
            />

            {lessons.loading && (

                <div className="flex justify-center py-16">

                    <div className="
                        w-12
                        h-12
                        rounded-full
                        border-4
                        border-cyan-500
                        border-t-transparent
                        animate-spin
                    " />

                </div>

            )}

            {!lessons.loading && lessons.lessons.length === 0 && (

                <div className="
                    rounded-3xl
                    border
                    border-white/10
                    bg-white/[0.04]
                    p-10
                    text-center
                    text-gray-400
                ">

                    Ten moduł nie posiada jeszcze żadnych lekcji.

                </div>

            )}

            {!lessons.loading && lessons.lessons.length > 0 && (

                <div className="space-y-6">

                    {lessons.lessons.map((lesson) => (

                        <LessonCard

                            key={lesson.id}

                            lesson={lesson}

                            expanded={expanded.isExpanded(lesson.id)}

                            toggle={() =>
                                expanded.toggle(
                                    lesson.id,
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

            )}

        </div>

    );

}

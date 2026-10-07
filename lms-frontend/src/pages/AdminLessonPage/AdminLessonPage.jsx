import { useParams } from "react-router-dom";

import LessonForm from "./LessonForm";
import LessonCard from "./LessonCard";

import useLessons from "./hooks/useLessons";
import useLessonBlocks from "./hooks/useLessonBlocks";
import useExpandedLesson from "./hooks/useExpandedLesson";
import useModule from "./hooks/useModule";

export default function AdminLessonPage() {

    const { moduleId } = useParams();

    const lessons = useLessons(moduleId);
    const lessonBlocks = useLessonBlocks();
    const expanded = useExpandedLesson();
    const moduleData = useModule(moduleId);
    const lessonVariant = moduleData.isLanguageCourse ? "LANGUAGE" : "PROGRAMMING";

    return (

        <div className="space-y-10">

            <section className="rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.07] p-5 text-cyan-50 sm:p-6">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                    {moduleData.isLanguageCourse
                        ? `Kreator językowy · CEFR ${moduleData.moduleSettings.cefrLevel || "A1"}`
                        : "Jak zbudować ścieżkę"}
                </p>
                <h2 className="mt-2 text-xl font-black">
                    {moduleData.isLanguageCourse
                        ? "Jedna krótka lekcja powinna ćwiczyć jeden cel komunikacyjny"
                        : "Jedna karta poniżej to jedna lekcja na roadmapie ucznia"}
                </h2>
                <p className="mt-3 max-w-4xl leading-7 text-cyan-100/75">
                    {moduleData.isLanguageCourse
                        ? "Dodaj kilka słów lub zwrotów, krótki przykład użycia i 2–4 proste ćwiczenia. Kreator ukrywa elementy programistyczne, aby budowanie lekcji było szybsze i czytelniejsze."
                        : "Jeżeli uczeń ma osobno ukończyć „Wprowadzenie”, „Pierwszy program” i „Zmienne”, utwórz trzy oddzielne lekcje. Bloki tekstu, informacji, zadań i quizów są krokami wewnątrz jednej lekcji."}
                </p>
            </section>

            <LessonForm
                form={lessons.lessonForm}
                setForm={lessons.setLessonForm}
                editingId={lessons.editingLessonId}
                onCreate={lessons.createLesson}
                onUpdate={lessons.updateLesson}
                variant={lessonVariant}
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
                                    lessonBlocks
                                )
                            }

                            onEdit={lessons.editLesson}

                            onDelete={lessons.deleteLesson}

                            lessonBlocks={lessonBlocks}
                            variant={lessonVariant}

                        />

                    ))}

                </div>

            )}

        </div>

    );

}

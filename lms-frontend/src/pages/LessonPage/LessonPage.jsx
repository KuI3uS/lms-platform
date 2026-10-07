import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../api/api";

import LessonHero from "./LessonHero";
import LessonSidebar from "./LessonSidebar";
import LessonBlock from "./LessonBlock";
import LessonFooter from "./LessonFooter";

export default function LessonPage() {

    const { lessonId } = useParams();
    const navigate = useNavigate();

    const [lesson, setLesson] = useState(null);
    const [blocks, setBlocks] = useState([]);
    const [moduleLessons, setModuleLessons] = useState([]);

    const [selectedBlock, setSelectedBlock] = useState(null);

    const [answers, setAnswers] = useState({});
    const [results, setResults] = useState({});

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {

        loadLesson();

    }, [lessonId]);

    async function loadLesson() {

        try {

            setLoading(true);

            setLesson(null);
            setBlocks([]);
            setModuleLessons([]);
            setSelectedBlock(null);

            setAnswers({});
            setResults({});

            const lessonData =
                await apiFetch(`/lessons/${lessonId}`);

            setLesson(lessonData);

            if (lessonData?.moduleId) {

                const lessons =
                    await apiFetch(`/lessons/module/${lessonData.moduleId}`);

                const mapped = await Promise.all(

                    lessons.map(async lesson => {

                        try {

                            const canAccess =
                                await apiFetch(`/lessons/${lesson.id}/access`);

                            return {
                                ...lesson,
                                canAccess
                            };

                        } catch {

                            return {
                                ...lesson,
                                canAccess: false
                            };

                        }

                    })

                );

                setModuleLessons(
                    mapped.sort(
                        (a, b) =>
                            (a.orderIndex ?? 0) -
                            (b.orderIndex ?? 0)
                    )
                );

            }

            const lessonBlocks =
                await apiFetch(`/lesson-blocks/lesson/${lessonId}`);

            const sorted =
                [...lessonBlocks].sort(
                    (a, b) =>
                        (a.orderIndex ?? 0) -
                        (b.orderIndex ?? 0)
                );

            setBlocks(sorted);

            setSelectedBlock(sorted[0] || null);

            const initialAnswers = {};

            sorted
                .filter(b => b.type === "TASK")
                .forEach(block => {

                    initialAnswers[block.id] =
                        block.starterCode || "";

                });

            setAnswers(initialAnswers);

        }

        catch (e) {

            console.error(e);

            setError(e.message);

        }

        finally {

            setLoading(false);

        }

    }

    async function checkTask(blockId) {

        try {

            const result =
                await apiFetch(`/lesson-blocks/${blockId}/check`, {

                    method: "POST",

                    body: JSON.stringify({

                        answer: answers[blockId] || ""

                    })

                });

            setResults(prev => ({

                ...prev,

                [blockId]:
                    typeof result === "boolean"
                        ? result
                        : result.correct

            }));

        }

        catch (e) {

            console.error(e);

            alert("Nie udało się sprawdzić zadania.");

        }

    }

    async function submitLesson() {

        try {

            const taskBlocks =
                blocks.filter(
                    b => b.type === "TASK"
                );

            await apiFetch("/lesson-submit", {

                method: "POST",

                body: JSON.stringify({

                    lessonId: Number(lessonId),

                    lessonTitle: lesson.title,

                    answers: taskBlocks.map(block => ({

                        taskId: block.id,

                        taskContent: block.instruction,

                        studentAnswer:
                            answers[block.id] || ""

                    }))

                })

            });

            await apiFetch(
                `/lessons/${lessonId}/complete`,
                {
                    method: "POST"
                }
            );

            alert("Lekcja ukończona.");

            loadLesson();

        }

        catch (e) {

            console.error(e);

            alert("Nie udało się wysłać lekcji.");

        }

    }

    function goBack() {

        if (lesson?.moduleId) {

            navigate(`/lessons/${lesson.moduleId}`);

        }

        else {

            navigate("/courses");

        }

    }

    if (loading) {

        return (

            <div className="min-h-screen bg-gray-950 flex items-center justify-center">

                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>

            </div>

        );

    }

    if (error) {

        return (

            <div className="min-h-screen bg-gray-950 p-8 text-red-400">

                {error}

            </div>

        );

    }

    if (!lesson) return null;

    const currentIndex =
        moduleLessons.findIndex(
            l => Number(l.id) === Number(lessonId)
        );

    const previousLesson =
        currentIndex > 0
            ? moduleLessons[currentIndex - 1]
            : null;

    const nextLesson =
        currentIndex < moduleLessons.length - 1
            ? moduleLessons[currentIndex + 1]
            : null;

    return (

        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(147,51,234,0.15),transparent_35%),#030712] text-white">

            <div className="max-w-7xl mx-auto p-6 space-y-6">

                <LessonHero

                    lesson={lesson}

                    moduleLessons={moduleLessons}

                    onBack={goBack}

                />

                <div className="grid xl:grid-cols-[320px_1fr] gap-6">

                    <LessonSidebar

                        blocks={blocks}

                        selectedBlock={selectedBlock}

                        setSelectedBlock={setSelectedBlock}

                        moduleLessons={moduleLessons}

                        currentLessonId={lessonId}

                    />

                    <main className="space-y-6">

                        <LessonBlock

                            block={selectedBlock}

                            blocks={blocks}

                            answers={answers}

                            setAnswers={setAnswers}

                            results={results}

                            checkTask={checkTask}

                        />

                        <LessonFooter

                            hasTasks={
                                blocks.some(
                                    b => b.type === "TASK"
                                )
                            }

                            onSubmit={submitLesson}

                            previousLesson={previousLesson}

                            nextLesson={nextLesson}

                            onPrevious={() =>
                                previousLesson &&
                                navigate(`/lesson/${previousLesson.id}`)
                            }

                            onNext={() =>
                                nextLesson &&
                                navigate(`/lesson/${nextLesson.id}`)
                            }

                        />

                    </main>

                </div>

            </div>

        </div>

    );

}
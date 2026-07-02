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
    const [tasks, setTasks] = useState([]);
    const [moduleLessons, setModuleLessons] = useState([]);

    const [selectedBlock, setSelectedBlock] = useState(null);
    const [answers, setAnswers] = useState({});
    const [results, setResults] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadLesson();
    }, [lessonId]);

    const loadLesson = async () => {
        try {
            setLoading(true);
            setError(null);
            setLesson(null);
            setBlocks([]);
            setTasks([]);
            setModuleLessons([]);
            setSelectedBlock(null);
            setAnswers({});
            setResults({});

            const lessonData = await apiFetch(`/lessons/${lessonId}`);
            setLesson(lessonData);

            if (lessonData?.moduleId) {
                const lessonsData = await apiFetch(`/lessons/module/${lessonData.moduleId}`);

                const lessonsWithAccess = await Promise.all(
                    (lessonsData || []).map(async (l) => {
                        try {
                            const canAccess = await apiFetch(`/lessons/${l.id}/access`);
                            return { ...l, canAccess };
                        } catch {
                            return { ...l, canAccess: false };
                        }
                    })
                );

                setModuleLessons(
                    lessonsWithAccess.sort(
                        (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
                    )
                );
            }

            const blocksData = await apiFetch(`/lesson-blocks/lesson/${lessonId}`);
            const sortedBlocks = [...(blocksData || [])].sort(
                (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
            );

            setBlocks(sortedBlocks);
            setSelectedBlock(sortedBlocks[0] || null);

            const tasksData = await apiFetch(`/tasks/lesson/${lessonId}`);
            const sortedTasks = [...(tasksData || [])].sort(
                (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
            );

            setTasks(sortedTasks);

            const initialAnswers = {};
            sortedTasks.forEach(task => {
                if (task.type === "CODE") {
                    initialAnswers[task.id] = task.starterCode || "";
                }
            });

            setAnswers(initialAnswers);
        } catch (e) {
            console.error(e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const checkTask = async (taskId) => {
        try {
            const res = await apiFetch(`/tasks/${taskId}/check`, {
                method: "POST",
                body: JSON.stringify({
                    answer: answers[taskId] || ""
                })
            });

            const correct = typeof res === "boolean" ? res : res.correct;

            setResults(prev => ({
                ...prev,
                [taskId]: correct
            }));
        } catch (e) {
            console.error(e);
            alert("Błąd sprawdzania odpowiedzi");
        }
    };

    const submitLesson = async () => {
        try {
            await apiFetch("/lesson-submit", {
                method: "POST",
                body: JSON.stringify({
                    lessonId: Number(lessonId),
                    lessonTitle: lesson.title,
                    answers: tasks.map(task => ({
                        taskId: task.id,
                        taskContent: task.taskContent,
                        studentAnswer: answers[task.id] || ""
                    }))
                })
            });

            await apiFetch(`/lessons/${lessonId}/complete`, {
                method: "POST"
            });

            alert("Lekcja ukończona");
            await loadLesson();
        } catch (e) {
            console.error(e);
            alert("Błąd wysyłania lekcji");
        }
    };

    const goBack = () => {
        if (lesson?.moduleId) {
            navigate(`/lessons/${lesson.moduleId}`);
        } else {
            navigate("/courses");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-950 text-red-400 p-8">
                Błąd: {error}
            </div>
        );
    }

    if (!lesson) return null;

    const currentIndex = moduleLessons.findIndex(
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

                <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6">
                    <LessonSidebar
                        blocks={blocks}
                        selectedBlock={selectedBlock}
                        setSelectedBlock={setSelectedBlock}
                        moduleLessons={moduleLessons}
                        currentLessonId={lessonId}
                    />

                    <main className="min-w-0 space-y-6">
                        <LessonBlock
                            block={selectedBlock}
                            blocks={blocks}
                            tasks={tasks}
                            answers={answers}
                            setAnswers={setAnswers}
                            results={results}
                            checkTask={checkTask}
                        />

                        <LessonFooter
                            hasTasks={tasks.length > 0}
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
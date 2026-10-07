import { useCallback, useEffect, useState } from "react";
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
    const [checkingTaskId, setCheckingTaskId] = useState(null);
    const [finishing, setFinishing] = useState(false);
    const [finishResult, setFinishResult] = useState(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadLesson = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            setLesson(null);
            setBlocks([]);
            setModuleLessons([]);
            setSelectedBlock(null);
            setAnswers({});
            setResults({});
            setFinishResult(null);

            const lessonData = await apiFetch(`/lessons/${lessonId}`);
            setLesson(lessonData);

            const [lessons, lessonBlocks] = await Promise.all([
                lessonData?.moduleId
                    ? apiFetch(`/lessons/module/${lessonData.moduleId}`)
                    : Promise.resolve([]),
                apiFetch(`/lesson-blocks/lesson/${lessonId}`)
            ]);

            setModuleLessons(
                [...(lessons || [])].sort(
                    (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
                )
            );

            const sorted = [...lessonBlocks].sort(
                (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
            );

            setBlocks(sorted);
            setSelectedBlock(sorted[0] || null);

            const initialAnswers = {};
            sorted
                .filter(block => ["TASK", "QUIZ"].includes(block.type))
                .forEach(block => {
                    initialAnswers[block.id] = block.type === "QUIZ"
                        ? ""
                        : block.starterCode || "";
                });
            setAnswers(initialAnswers);
        } catch (requestError) {
            console.error(requestError);
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }, [lessonId]);

    useEffect(() => {
        // Pobranie danych po zmianie identyfikatora lekcji jest właściwym użyciem efektu.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        loadLesson();
    }, [loadLesson]);

    function markLessonCompleted() {
        setModuleLessons(previous => {
            const currentIndex = previous.findIndex(
                item => Number(item.id) === Number(lessonId)
            );

            return previous.map((item, index) => ({
                ...item,
                completed: index === currentIndex ? true : item.completed,
                canAccess: index === currentIndex + 1 ? true : item.canAccess
            }));
        });
    }

    function updateAnswer(blockId, value) {
        setAnswers(previous => ({ ...previous, [blockId]: value }));
        setResults(previous => {
            if (!(blockId in previous)) return previous;
            const next = { ...previous };
            delete next[blockId];
            return next;
        });
        setFinishResult(null);
    }

    function resetTask(block) {
        updateAnswer(
            block.id,
            block.type === "QUIZ" ? "" : block.starterCode || ""
        );
    }

    async function checkTask(blockId) {
        try {
            setCheckingTaskId(blockId);

            const response = await apiFetch(`/lesson-blocks/${blockId}/check`, {
                method: "POST",
                body: JSON.stringify({ answer: answers[blockId] || "" })
            });

            const normalizedResponse = typeof response === "boolean"
                ? {
                    correct: response,
                    message: response
                        ? "Świetnie — rozwiązanie jest poprawne."
                        : "Rozwiązanie wymaga poprawy.",
                    attemptCount: 1,
                    hintLevel: 0,
                    diagnostics: []
                }
                : response;

            setResults(previous => ({ ...previous, [blockId]: normalizedResponse }));

            if (normalizedResponse.lessonCompleted) {
                markLessonCompleted();
            }

            return normalizedResponse;
        } catch (requestError) {
            console.error(requestError);
            const failure = {
                correct: false,
                message: requestError.message || "Nie udało się sprawdzić zadania.",
                diagnostics: [],
                error: true
            };
            setResults(previous => ({ ...previous, [blockId]: failure }));
            return failure;
        } finally {
            setCheckingTaskId(null);
        }
    }

    async function finishLesson() {
        const taskBlocks = blocks.filter(
            block => ["TASK", "QUIZ"].includes(block.type)
        );

        try {
            setFinishing(true);
            setFinishResult(null);

            if (taskBlocks.length === 0) {
                await apiFetch(`/lessons/${lessonId}/complete`, { method: "POST" });
                markLessonCompleted();
                setFinishResult({
                    success: true,
                    message: "Lekcja została ukończona.",
                    summary: "Postęp modułu został zaktualizowany."
                });
                return;
            }

            const checkedResults = [];

            for (const block of taskBlocks) {
                const currentResult = results[block.id];
                const result = currentResult?.correct
                    ? currentResult
                    : await checkTask(block.id);
                checkedResults.push({ block, result });
            }

            const incorrect = checkedResults.filter(item => !item.result?.correct);
            const correctCount = checkedResults.length - incorrect.length;

            if (incorrect.length > 0) {
                setSelectedBlock(incorrect[0].block);
                setFinishResult({
                    success: false,
                    message: `Popraw ${incorrect.length} ${incorrect.length === 1 ? "zadanie" : "zadania"} i spróbuj ponownie.`,
                    summary: `Poprawne odpowiedzi: ${correctCount} / ${checkedResults.length}. Pierwsze błędne zadanie zostało otwarte.`
                });
                return;
            }

            await apiFetch(`/lessons/${lessonId}/complete`, { method: "POST" });
            markLessonCompleted();
            setFinishResult({
                success: true,
                message: "Wszystkie odpowiedzi są poprawne. Lekcja została ukończona!",
                summary: `Poprawne odpowiedzi: ${correctCount} / ${checkedResults.length}. Postęp modułu został zaktualizowany.`
            });
        } catch (requestError) {
            console.error(requestError);
            setFinishResult({
                success: false,
                message: "Nie udało się zakończyć rozwiązania.",
                summary: requestError.message
            });
        } finally {
            setFinishing(false);
        }
    }

    function goBack() {
        navigate(lesson?.moduleId ? `/lessons/${lesson.moduleId}` : "/courses");
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-950">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"/>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-gray-950 p-8 text-center text-red-400">
                <p>{error}</p>
                <button
                    type="button"
                    onClick={loadLesson}
                    className="rounded-xl bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700"
                >
                    Spróbuj ponownie
                </button>
            </div>
        );
    }

    if (!lesson) return null;

    const currentIndex = moduleLessons.findIndex(
        item => Number(item.id) === Number(lessonId)
    );
    const previousLesson = currentIndex > 0 ? moduleLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex >= 0 && currentIndex < moduleLessons.length - 1
        ? moduleLessons[currentIndex + 1]
        : null;
    const hasTasks = blocks.some(
        block => ["TASK", "QUIZ"].includes(block.type)
    );

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(147,51,234,0.15),transparent_35%),#030712] text-white">
            <div className="mx-auto max-w-7xl space-y-6 p-3 sm:p-6">
                <LessonHero
                    lesson={lesson}
                    moduleLessons={moduleLessons}
                    onBack={goBack}
                />

                <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
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
                            answers={answers}
                            results={results}
                            checkingTaskId={checkingTaskId}
                            onAnswerChange={updateAnswer}
                            onReset={resetTask}
                            onCheck={checkTask}
                        />

                        <LessonFooter
                            hasTasks={hasTasks}
                            onFinish={finishLesson}
                            finishing={finishing}
                            finishResult={finishResult}
                            previousLesson={previousLesson}
                            nextLesson={nextLesson}
                            onPrevious={() => previousLesson && navigate(`/lesson/${previousLesson.id}`)}
                            onNext={() => nextLesson?.canAccess && navigate(`/lesson/${nextLesson.id}`)}
                        />
                    </main>
                </div>
            </div>
        </div>
    );
}

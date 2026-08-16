import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../api/api";
import {
    canAccessLessonStep,
    getActiveLessonStepIndex
} from "../../utils/lessonSteps";

import LessonHero from "./LessonHero";
import LessonSidebar from "./LessonSidebar";
import LessonBlock from "./LessonBlock";
import LessonFooter from "./LessonFooter";

export default function LessonPage() {
    const { lessonId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const requestedStepId = new URLSearchParams(location.search).get("step");

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

            const sortedLessons = [...(lessons || [])].sort(
                (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
            );
            setModuleLessons(sortedLessons);

            const sorted = [...lessonBlocks].sort(
                (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
            );

            setBlocks(sorted);

            const lessonCompleted = Boolean(sortedLessons.find(
                item => Number(item.id) === Number(lessonId)
            )?.completed);
            const requestedIndex = sorted.findIndex(
                block => Number(block.id) === Number(requestedStepId)
            );
            const resumeIndex = getActiveLessonStepIndex(
                sorted,
                lessonCompleted
            );
            const initialIndex = requestedIndex >= 0
                && canAccessLessonStep(sorted, requestedIndex)
                ? requestedIndex
                : resumeIndex >= 0 && resumeIndex < sorted.length
                    ? resumeIndex
                    : Math.max(sorted.length - 1, 0);

            setSelectedBlock(sorted[initialIndex] || null);

            const initialAnswers = {};
            const initialResults = {};
            sorted
                .filter(block => ["TASK", "QUIZ"].includes(block.type))
                .forEach(block => {
                    initialAnswers[block.id] = block.type === "QUIZ"
                        ? block.lastAnswer || ""
                        : block.lastAnswer ?? block.starterCode ?? "";

                    if (block.attempted) {
                        initialResults[block.id] = {
                            correct: Boolean(block.correct),
                            attemptCount: block.attemptCount || 0,
                            message: block.correct
                                ? "To ćwiczenie jest już zaliczone."
                                : "To ćwiczenie nie jest jeszcze zaliczone. Popraw odpowiedź i sprawdź ją ponownie.",
                            diagnostics: [],
                            persisted: true
                        };
                    }
                });
            setAnswers(initialAnswers);
            setResults(initialResults);
        } catch (requestError) {
            console.error(requestError);
            setError(requestError.message);
        } finally {
            setLoading(false);
        }
    }, [lessonId, requestedStepId]);

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
            setBlocks(previous => previous.map(block => (
                Number(block.id) === Number(blockId)
                    ? {
                        ...block,
                        attempted: true,
                        correct: normalizedResponse.correct,
                        attemptCount: normalizedResponse.attemptCount,
                        lastAnswer: answers[blockId] || ""
                    }
                    : block
            )));
            setSelectedBlock(previous => (
                Number(previous?.id) === Number(blockId)
                    ? {
                        ...previous,
                        attempted: true,
                        correct: normalizedResponse.correct,
                        attemptCount: normalizedResponse.attemptCount,
                        lastAnswer: answers[blockId] || ""
                    }
                    : previous
            ));
            window.dispatchEvent(new Event("eduhub:stats-changed"));

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

            const incomplete = taskBlocks.filter(
                block => !(results[block.id]?.correct || block.correct)
            );
            const correctCount = taskBlocks.length - incomplete.length;

            if (incomplete.length > 0) {
                setSelectedBlock(incomplete[0]);
                setFinishResult({
                    success: false,
                    message: `Ukończ ${incomplete.length} ${incomplete.length === 1 ? "pozostałe ćwiczenie" : "pozostałe ćwiczenia"}.`,
                    summary: `Zaliczone ćwiczenia: ${correctCount} / ${taskBlocks.length}. Otworzyłem pierwszy nieukończony krok.`
                });
                return;
            }

            const completion = await apiFetch(`/lessons/${lessonId}/complete`, { method: "POST" });
            markLessonCompleted();
            window.dispatchEvent(new Event("eduhub:stats-changed"));
            const rewardSummary = completion.newlyCompleted
                ? `Zdobywasz +${completion.gemsEarned} klejnotów i +${completion.xpEarned} XP.`
                : "Ta lekcja była już ukończona — nagroda nie jest naliczana drugi raz.";
            setFinishResult({
                success: true,
                message: `Lekcja ${lesson.orderIndex} została ukończona!`,
                summary: `${rewardSummary} ${nextLesson
                    ? `Odblokowano kolejną lekcję: ${nextLesson.title}.`
                    : "Ukończyłeś ostatnią lekcję w tym etapie."}`
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
    const selectedBlockIndex = blocks.findIndex(
        block => Number(block.id) === Number(selectedBlock?.id)
    );
    const previousBlock = selectedBlockIndex > 0
        ? blocks[selectedBlockIndex - 1]
        : null;
    const nextBlock = selectedBlockIndex >= 0
        && selectedBlockIndex < blocks.length - 1
        ? blocks[selectedBlockIndex + 1]
        : null;
    const assessmentBlocks = blocks.filter(
        block => ["TASK", "QUIZ"].includes(block.type)
    );
    const completedAssessmentCount = assessmentBlocks.filter(
        block => results[block.id]?.correct || block.correct
    ).length;
    const currentBlockCompleted = selectedBlock
        ? !["TASK", "QUIZ"].includes(selectedBlock.type)
            || results[selectedBlock.id]?.correct
            || selectedBlock.correct
        : true;

    function canAccessBlock(targetBlock) {
        const targetIndex = blocks.findIndex(
            block => Number(block.id) === Number(targetBlock?.id)
        );
        if (targetIndex <= 0) return true;

        return blocks.slice(0, targetIndex).every(block => (
            !["TASK", "QUIZ"].includes(block.type)
            || results[block.id]?.correct
            || block.correct
        ));
    }

    function selectBlock(targetBlock) {
        if (targetBlock && canAccessBlock(targetBlock)) {
            setSelectedBlock(targetBlock);
            setFinishResult(null);
        }
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(147,51,234,0.15),transparent_35%),#030712] text-white">
            <div className="mx-auto max-w-7xl space-y-6 p-3 sm:p-6">
                <LessonSidebar
                    blocks={blocks}
                    selectedBlock={selectedBlock}
                    setSelectedBlock={selectBlock}
                    moduleLessons={moduleLessons}
                    currentLessonId={lessonId}
                    results={results}
                    canAccessBlock={canAccessBlock}
                    lessonCompleted={Boolean(moduleLessons[currentIndex]?.completed)}
                />

                <LessonHero
                    lesson={lesson}
                    moduleLessons={moduleLessons}
                    onBack={goBack}
                />

                <main className="mx-auto min-w-0 max-w-5xl space-y-6">
                    <div
                        key={selectedBlock?.id || "empty-step"}
                        className="lesson-step-transition"
                    >
                        <LessonBlock
                            block={selectedBlock}
                            answers={answers}
                            results={results}
                            checkingTaskId={checkingTaskId}
                            onAnswerChange={updateAnswer}
                            onReset={resetTask}
                            onCheck={checkTask}
                        />
                    </div>

                    <LessonFooter
                        onFinish={finishLesson}
                        finishing={finishing}
                        finishResult={finishResult}
                        hasPreviousStep={Boolean(previousBlock)}
                        hasNextStep={Boolean(nextBlock)}
                        canContinue={Boolean(currentBlockCompleted)}
                        onPreviousStep={() => previousBlock && selectBlock(previousBlock)}
                        onNextStep={() => nextBlock && selectBlock(nextBlock)}
                        previousLesson={previousLesson}
                        nextLesson={nextLesson}
                        onPreviousLesson={() => previousLesson && navigate(`/lesson/${previousLesson.id}`)}
                        onNextLesson={() => nextLesson && navigate(`/lesson/${nextLesson.id}`)}
                        onBack={goBack}
                        completedAssessments={completedAssessmentCount}
                        totalAssessments={assessmentBlocks.length}
                        hasTasks={hasTasks}
                    />
                </main>
            </div>
        </div>
    );
}

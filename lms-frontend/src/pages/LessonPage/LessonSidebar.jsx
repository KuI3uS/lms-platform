import {
    BsCheckCircleFill,
    BsCodeSlash,
    BsDashLg,
    BsDownload,
    BsExclamationTriangle,
    BsFileText,
    BsImage,
    BsInfoCircle,
    BsLightbulb,
    BsLockFill,
    BsPlayBtn,
    BsQuestionCircle,
    BsQuote
} from "react-icons/bs";
import { useNavigate } from "react-router-dom";

const ASSESSMENT_TYPES = new Set(["TASK", "QUIZ"]);

function blockIcon(type) {
    switch (type) {
        case "TIP":
            return <BsLightbulb />;
        case "WARNING":
            return <BsExclamationTriangle />;
        case "INFO":
            return <BsInfoCircle />;
        case "IMAGE":
            return <BsImage />;
        case "VIDEO":
            return <BsPlayBtn />;
        case "PDF":
        case "DOWNLOAD":
            return <BsDownload />;
        case "EXAMPLE":
            return <BsCodeSlash />;
        case "TASK":
        case "QUIZ":
            return <BsQuestionCircle />;
        case "QUOTE":
            return <BsQuote />;
        case "DIVIDER":
            return <BsDashLg />;
        default:
            return <BsFileText />;
    }
}

export default function LessonSidebar({
                                          moduleLessons,
                                          currentLessonId,
                                          blocks,
                                          selectedBlock,
                                          setSelectedBlock,
                                          results,
                                          canAccessBlock,
                                          lessonCompleted
                                      }) {
    const navigate = useNavigate();
    const selectedIndex = blocks.findIndex(
        block => Number(block.id) === Number(selectedBlock?.id)
    );
    const currentLessonIndex = moduleLessons.findIndex(
        lesson => Number(lesson.id) === Number(currentLessonId)
    );
    const currentProgress = blocks.length
        ? Math.round(((selectedIndex + 1) / blocks.length) * 100)
        : 0;

    function isCompleted(block, index) {
        if (lessonCompleted) return true;
        if (ASSESSMENT_TYPES.has(block.type)) {
            return Boolean(results[block.id]?.correct || block.correct);
        }
        return index < selectedIndex;
    }

    return (
        <nav
            aria-label="Ścieżka lekcji"
            className="rounded-[2rem] border border-white/10 bg-gray-900/90 p-4 shadow-2xl backdrop-blur sm:p-6"
        >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                        Lekcja {currentLessonIndex + 1} z {moduleLessons.length}
                    </p>
                    <h2 className="mt-1 truncate text-xl font-black text-white">
                        Krok {selectedIndex + 1} z {blocks.length}: {selectedBlock?.title || "Materiał"}
                    </h2>
                </div>

                <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
                    {moduleLessons.map((lesson, index) => {
                        const active = Number(currentLessonId) === Number(lesson.id);
                        return (
                            <button
                                key={lesson.id}
                                type="button"
                                title={`Lekcja ${index + 1}: ${lesson.title}`}
                                aria-label={`Lekcja ${index + 1}: ${lesson.title}`}
                                disabled={!lesson.canAccess}
                                onClick={() => lesson.canAccess && navigate(`/lesson/${lesson.id}`)}
                                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-sm font-black transition ${
                                    active
                                        ? "border-cyan-300 bg-blue-600 text-white ring-4 ring-blue-500/20"
                                        : lesson.completed
                                            ? "border-emerald-300/40 bg-emerald-500/20 text-emerald-200"
                                            : lesson.canAccess
                                                ? "border-white/15 bg-white/5 text-gray-300 hover:border-blue-400"
                                                : "cursor-not-allowed border-white/5 bg-black/20 text-gray-600"
                                }`}
                            >
                                {lesson.completed ? <BsCheckCircleFill /> : index + 1}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-800">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 transition-all duration-300"
                    style={{ width: `${currentProgress}%` }}
                />
            </div>

            <div className="mt-5 flex gap-3 overflow-x-auto pb-2">
                {blocks.map((block, index) => {
                    const active = Number(selectedBlock?.id) === Number(block.id);
                    const accessible = canAccessBlock(block);
                    const completed = isCompleted(block, index);
                    const attemptedIncorrectly = ASSESSMENT_TYPES.has(block.type)
                        && (block.attempted || results[block.id])
                        && !completed;

                    return (
                        <button
                            key={block.id}
                            type="button"
                            disabled={!accessible}
                            onClick={() => accessible && setSelectedBlock(block)}
                            title={`${index + 1}. ${block.title || block.type}`}
                            className="group flex min-w-[76px] shrink-0 flex-col items-center gap-2 text-center"
                        >
                            <span className={`grid h-12 w-12 place-items-center rounded-2xl border text-lg transition ${
                                active
                                    ? "border-cyan-200 bg-blue-600 text-white shadow-lg shadow-blue-500/25 ring-4 ring-blue-500/15"
                                    : completed
                                        ? "border-emerald-300/40 bg-emerald-500/20 text-emerald-200"
                                        : attemptedIncorrectly
                                            ? "border-orange-300/40 bg-orange-500/15 text-orange-200"
                                            : accessible
                                                ? "border-white/15 bg-gray-800 text-gray-300 group-hover:border-blue-400 group-hover:text-white"
                                                : "border-white/5 bg-gray-950 text-gray-600"
                            }`}>
                                {!accessible
                                    ? <BsLockFill />
                                    : completed
                                        ? <BsCheckCircleFill />
                                        : blockIcon(block.type)
                                }
                            </span>
                            <span className={`text-[11px] font-bold ${
                                active ? "text-cyan-200" : "text-gray-500"
                            }`}>
                                Krok {index + 1}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}

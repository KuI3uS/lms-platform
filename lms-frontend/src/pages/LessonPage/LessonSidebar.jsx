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
            className="mx-auto w-full max-w-5xl px-1 py-3 sm:px-4"
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                        Lekcja {currentLessonIndex + 1} z {moduleLessons.length}
                    </p>
                    <h2 className="mt-1 truncate text-base font-black text-white sm:text-lg">
                        Krok {selectedIndex + 1} z {blocks.length}: {selectedBlock?.title || "Materiał"}
                    </h2>
                </div>

                <div
                    className="flex max-w-full items-center gap-2 overflow-x-auto pb-1"
                    aria-label="Lekcje w tym etapie"
                >
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
                                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border text-xs font-black transition-all duration-200 ${
                                    active
                                        ? "scale-110 border-cyan-200 bg-blue-600 text-white shadow-lg shadow-blue-500/30 ring-4 ring-blue-500/15"
                                        : lesson.completed
                                            ? "border-emerald-300/50 bg-emerald-500 text-white"
                                            : lesson.canAccess
                                                ? "border-white/15 bg-gray-800 text-gray-300 hover:-translate-y-0.5 hover:border-blue-400"
                                                : "cursor-not-allowed border-white/5 bg-gray-900 text-gray-700"
                                }`}
                            >
                                {lesson.completed ? <BsCheckCircleFill /> : index + 1}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mt-5 h-1 overflow-hidden rounded-full bg-gray-900">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 transition-[width] duration-500"
                    style={{ width: `${currentProgress}%` }}
                />
            </div>

            {blocks.length > 0 && (
                <div className="relative mt-6 overflow-x-auto pb-3 pt-2">
                    <div
                        aria-hidden="true"
                        className="absolute left-9 right-9 top-[37px] h-1 rounded-full bg-gray-900"
                    />
                    <ol className="relative flex min-w-max items-start gap-5 px-2 sm:justify-center sm:gap-7">
                        {blocks.map((block, index) => {
                            const active = Number(selectedBlock?.id) === Number(block.id);
                            const accessible = canAccessBlock(block);
                            const completed = isCompleted(block, index);
                            const attemptedIncorrectly = ASSESSMENT_TYPES.has(block.type)
                                && (block.attempted || results[block.id])
                                && !completed;

                            return (
                                <li key={block.id}>
                                    <button
                                        type="button"
                                        disabled={!accessible}
                                        onClick={() => accessible && setSelectedBlock(block)}
                                        title={`${index + 1}. ${block.title || block.type}`}
                                        className="group flex w-[74px] shrink-0 flex-col items-center text-center sm:w-[84px]"
                                    >
                                        <span className={`relative z-10 grid h-14 w-14 place-items-center rounded-full border-2 border-b-[5px] text-lg transition-all duration-200 motion-safe:group-hover:-translate-y-1 motion-safe:group-active:translate-y-0 ${
                                            active
                                                ? "border-cyan-200 border-b-blue-900 bg-blue-600 text-white shadow-xl shadow-blue-500/30 ring-4 ring-blue-500/15"
                                                : completed
                                                    ? "border-emerald-300/70 border-b-emerald-800 bg-emerald-500 text-white"
                                                    : attemptedIncorrectly
                                                        ? "border-orange-300/60 border-b-orange-900 bg-orange-500/90 text-white"
                                                        : accessible
                                                            ? "border-gray-600 border-b-gray-950 bg-gray-800 text-gray-300 group-hover:border-blue-400 group-hover:text-white"
                                                            : "border-gray-800 border-b-black bg-gray-900 text-gray-700"
                                        }`}>
                                            {!accessible
                                                ? <BsLockFill />
                                                : completed
                                                    ? <BsCheckCircleFill />
                                                    : blockIcon(block.type)
                                            }
                                        </span>
                                        <span className={`mt-2 text-[10px] font-black uppercase tracking-wider ${
                                            active ? "text-cyan-200" : "text-gray-600"
                                        }`}>
                                            Krok {index + 1}
                                        </span>
                                    </button>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            )}
        </nav>
    );
}

import LessonText from "./LessonText";
import LessonExample from "./LessonExample";
import LessonImage from "./LessonImage";
import LessonTask from "./LessonTask";
import LessonVideo from "./LessonVideo";
import LessonDownload from "./LessonDownload";
import LessonQuote from "./LessonQuote";
import LessonDivider from "./LessonDivider";
import LessonQuiz from "./LessonQuiz";
import LessonAudio from "./LessonAudio";

export default function LessonBlock({
                                        block,
                                        answers,
                                        results,
                                        checkingTaskId,
                                        onAnswerChange,
                                        onReset,
                                        onCheck
                                    }) {

    if (!block) {
        return (
            <section className="bg-gray-900 border border-gray-800 rounded-3xl p-8 text-gray-400">
                Brak treści w tej lekcji.
            </section>
        );
    }

    switch (block.type) {

        case "TEXT":
        case "TIP":
        case "WARNING":
        case "SUMMARY":
        case "INFO":
            return <LessonText block={block} />;

        case "EXAMPLE":
            return <LessonExample block={block} />;

        case "IMAGE":
            return <LessonImage block={block} />;

        case "VIDEO":
            return <LessonVideo block={block} />;

        case "AUDIO":
            return <LessonAudio block={block} />;

        case "PDF":
        case "DOWNLOAD":
            return <LessonDownload block={block} />;

        case "QUOTE":
            return <LessonQuote block={block} />;

        case "DIVIDER":
            return <LessonDivider block={block} />;

        case "QUIZ":
            return (
                <LessonQuiz
                    block={block}
                    answers={answers}
                    result={results[block.id]}
                    checking={checkingTaskId === block.id}
                    onAnswerChange={onAnswerChange}
                    onReset={onReset}
                    onCheck={onCheck}
                />
            );

        case "TASK":
            return (
                <LessonTask
                    block={block}
                    answers={answers}
                    result={results[block.id]}
                    checking={checkingTaskId === block.id}
                    onAnswerChange={onAnswerChange}
                    onReset={onReset}
                    onCheck={onCheck}
                />
            );

        default:
            return <LessonText block={block} />;
    }
}

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
import LessonDialog from "./LessonDialog";
import LessonVocabulary from "./LessonVocabulary";
import LessonSentenceBuilder from "./LessonSentenceBuilder";
import LessonWordLab from "./LessonWordLab";
import LessonListening from "./LessonListening";

export default function LessonBlock({
                                        block,
                                        answers,
                                        results,
                                        checkingTaskId,
                                        onAnswerChange,
                                        onReset,
                                        onCheck,
                                        onInteractiveComplete
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
            return <LessonAudio block={block} onComplete={onInteractiveComplete} />;

        case "DIALOG":
            return <LessonDialog block={block} onComplete={onInteractiveComplete} />;

        case "VOCABULARY":
            return <LessonVocabulary block={block} onComplete={onInteractiveComplete} />;

        case "SENTENCE_BUILDER":
            return <LessonSentenceBuilder block={block} onComplete={onInteractiveComplete} />;

        case "WORD_LAB":
            return <LessonWordLab block={block} onComplete={onInteractiveComplete} />;

        case "LISTENING":
            return <LessonListening block={block} onComplete={onInteractiveComplete} />;

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

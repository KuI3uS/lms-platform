import LessonText from "./LessonText";
import LessonExample from "./LessonExample";
import LessonImage from "./LessonImage";
import LessonTask from "./LessonTask";

export default function LessonBlock({
                                        block,
                                        blocks,
                                        tasks,
                                        answers,
                                        setAnswers,
                                        results,
                                        checkTask
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

        case "TASK":
            return (
                <LessonTask
                    block={block}
                    blocks={blocks}
                    tasks={tasks}
                    answers={answers}
                    setAnswers={setAnswers}
                    results={results}
                    checkTask={checkTask}
                />
            );

        default:
            return <LessonText block={block} />;
    }
}
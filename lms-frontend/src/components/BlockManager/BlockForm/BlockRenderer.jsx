import TextBlockForm from "./forms/TextBlockForm";
import ExampleBlockForm from "./forms/ExampleBlockForm";
import ImageBlockForm from "./forms/ImageBlockForm";
import VideoBlockForm from "./forms/VideoBlockForm";
import DownloadBlockForm from "./forms/DownloadBlockForm";
import QuoteBlockForm from "./forms/QuoteBlockForm";
import DividerBlockForm from "./forms/DividerBlockForm";
import TaskBlockForm from "./forms/TaskBlockForm";
import QuizBlockForm from "./forms/QuizBlockForm";

export default function BlockRenderer({
                                          block,
                                          setBlock,
                                          tasks
                                      }) {

    switch (block.type) {

        case "TEXT":
        case "TIP":
        case "WARNING":
        case "INFO":
        case "SUMMARY":

            return (
                <TextBlockForm
                    block={block}
                    setBlock={setBlock}
                />
            );

        case "EXAMPLE":
            return (
                <ExampleBlockForm
                    block={block}
                    setBlock={setBlock}
                />
            );

        case "IMAGE":
            return (
                <ImageBlockForm
                    block={block}
                    setBlock={setBlock}
                />
            );

        case "VIDEO":
            return (
                <VideoBlockForm
                    block={block}
                    setBlock={setBlock}
                />
            );

        case "PDF":
        case "DOWNLOAD":
            return (
                <DownloadBlockForm
                    block={block}
                    setBlock={setBlock}
                />
            );

        case "QUOTE":
            return (
                <QuoteBlockForm
                    block={block}
                    setBlock={setBlock}
                />
            );

        case "TASK":
            return (
                <TaskBlockForm
                    block={block}
                    setBlock={setBlock}
                    tasks={tasks}
                />
            );

        case "QUIZ":
            return (
                <QuizBlockForm
                    block={block}
                    setBlock={setBlock}
                />
            );

        case "DIVIDER":
            return (
                <DividerBlockForm
                    block={block}
                    setBlock={setBlock}
                />
            );

        default:
            return null;

    }

}

import {
    BsCheckCircleFill,
    BsLockFill,
    BsPlayFill,
    BsFileText,
    BsCodeSlash,
    BsImage,
    BsQuestionCircle
} from "react-icons/bs";
import { useNavigate } from "react-router-dom";

export default function LessonSidebar({
                                          moduleLessons,
                                          currentLessonId,
                                          blocks,
                                          selectedBlock,
                                          setSelectedBlock
                                      }) {

    const navigate = useNavigate();

    const blockIcon = (type) => {
        switch (type) {
            case "TEXT":
                return <BsFileText />;
            case "EXAMPLE":
                return <BsCodeSlash />;
            case "IMAGE":
                return <BsImage />;
            case "TASK":
                return <BsQuestionCircle />;
            default:
                return <BsFileText />;
        }
    };

    return (
        <aside className="space-y-6">

            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5">

                <h2 className="text-xl font-bold mb-5">
                    Roadmap modułu
                </h2>

                <div className="space-y-3">

                    {moduleLessons.map((lesson, index) => {

                        const active = Number(currentLessonId) === Number(lesson.id);

                        return (
                            <button
                                key={lesson.id}
                                disabled={!lesson.canAccess}
                                onClick={() => {
                                    if (lesson.canAccess) {
                                        navigate(`/lesson/${lesson.id}`);
                                    }
                                }}
                                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition text-left ${
                                    active
                                        ? "bg-blue-600 text-white"
                                        : lesson.canAccess
                                            ? "bg-gray-800 hover:bg-gray-700"
                                            : "bg-gray-800/40 opacity-50 cursor-not-allowed"
                                }`}
                            >

                                {lesson.completed ? (
                                    <BsCheckCircleFill className="text-green-400 shrink-0" />
                                ) : lesson.canAccess ? (
                                    <BsPlayFill className="text-blue-300 shrink-0" />
                                ) : (
                                    <BsLockFill className="text-gray-500 shrink-0" />
                                )}

                                <div>
                                    <p className="text-xs opacity-70">
                                        Lekcja {lesson.orderIndex ?? index + 1}
                                    </p>

                                    <p className="font-semibold">
                                        {lesson.title}
                                    </p>
                                </div>

                            </button>
                        );

                    })}

                </div>

            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5">

                <h2 className="text-xl font-bold mb-5">
                    Zawartość lekcji
                </h2>

                <div className="space-y-2">

                    {blocks.map((block, index) => (

                        <button
                            key={block.id}
                            onClick={() => setSelectedBlock(block)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${
                                selectedBlock?.id === block.id
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-800 hover:bg-gray-700"
                            }`}
                        >

                            {blockIcon(block.type)}

                            <span className="flex-1 text-left">

                                {block.title ||
                                    `${block.type} ${index + 1}`}

                            </span>

                        </button>

                    ))}

                </div>

            </div>

        </aside>
    );
}
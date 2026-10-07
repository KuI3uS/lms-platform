import {
    BsChevronDown,
    BsChevronUp,
    BsPencilSquare,
    BsTrash,
    BsCollection
} from "react-icons/bs";

import BlockManager from "../../components/BlockManager/BlockManager";
export default function LessonCard({

                                       lesson,

                                       expanded,
                                       toggle,

                                       onEdit,
                                       onDelete,

                                       lessonBlocks,
                                       lessonTasks

                                   }) {

    return (

        <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">

            {/* HEADER */}

            <div className="flex items-center justify-between px-6 py-5">

                <div
                    onClick={() => toggle(lesson.id)}
                    className="flex items-center gap-4 cursor-pointer flex-1"
                >

                    <div className="bg-blue-600 w-10 h-10 rounded-xl flex items-center justify-center">

                        <BsCollection />

                    </div>

                    <div>

                        <h2 className="text-lg font-bold text-white">
                            Lekcja {lesson.orderIndex}
                        </h2>

                        <p className="text-gray-400">
                            {lesson.title}
                        </p>

                    </div>

                </div>

                <div className="flex items-center gap-2">

                    <button
                        onClick={() => onEdit(lesson)}
                        className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center"
                    >
                        <BsPencilSquare />
                    </button>

                    <button
                        onClick={() => onDelete(lesson.id)}
                        className="w-10 h-10 rounded-xl bg-red-600 hover:bg-red-700 flex items-center justify-center"
                    >
                        <BsTrash />
                    </button>

                    <button
                        onClick={() => toggle(lesson.id)}
                        className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center"
                    >
                        {expanded
                            ? <BsChevronUp />
                            : <BsChevronDown />
                        }
                    </button>

                </div>

            </div>

            {expanded && (

                <div className="border-t border-gray-800 p-6 space-y-8">

                    <BlockManager

                        lessonId={lesson.id}

                        lessonBlocks={lessonBlocks}

                        lessonTasks={lessonTasks}

                    />

                </div>

            )}

        </div>

    );

}
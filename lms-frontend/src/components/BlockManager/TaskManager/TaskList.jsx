import {
    BsGripVertical,
    BsPencilSquare,
    BsTrash,
    BsCodeSlash,
    BsCardText
} from "react-icons/bs";

export default function TaskList({
                                     lessonId,
                                     tasks = [],
                                     onEdit,
                                     onDelete
                                 }) {

    if (tasks.length === 0) {

        return (

            <div className="bg-gray-900 border border-dashed border-gray-700 rounded-3xl p-10 text-center">

                <div className="text-5xl mb-4">
                    📝
                </div>

                <h3 className="text-xl font-bold">
                    Brak zadań
                </h3>

                <p className="text-gray-500 mt-2">
                    Dodaj pierwsze zadanie do tej lekcji.
                </p>

            </div>

        );

    }

    return (

        <div className="space-y-3">

            {tasks
                .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
                .map((task, index) => (

                    <div
                        key={task.id}
                        className="group bg-gray-900 border border-gray-800 hover:border-yellow-500 rounded-2xl p-4 transition"
                    >

                        <div className="flex items-center justify-between">

                            {/* Lewa strona */}

                            <div className="flex items-center gap-4 flex-1">

                                <div className="text-gray-500 cursor-grab">
                                    <BsGripVertical />
                                </div>

                                <div className="w-12 h-12 rounded-xl bg-yellow-600 flex items-center justify-center text-xl">

                                    {task.type === "CODE"
                                        ? <BsCodeSlash />
                                        : <BsCardText />
                                    }

                                </div>

                                <div className="flex-1">

                                    <div className="flex items-center gap-2">

                                        <span className="text-gray-500 font-semibold">
                                            {index + 1}.
                                        </span>

                                        <span className="font-bold text-white">

                                            {task.taskContent?.slice(0, 70) || "Bez treści"}

                                        </span>

                                    </div>

                                    <div className="mt-1 flex items-center gap-3 text-sm text-gray-400">

                                        <span>

                                            {task.type}

                                        </span>

                                        <span>

                                            {task.language?.toUpperCase()}

                                        </span>

                                        <span>

                                            {task.points ?? 0} XP

                                        </span>

                                    </div>

                                </div>

                            </div>

                            {/* Prawa strona */}

                            <div className="flex items-center gap-2">

                                <button
                                    type="button"
                                    onClick={() => onEdit(lessonId, task)}
                                    className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-blue-600 transition flex items-center justify-center"
                                >
                                    <BsPencilSquare />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => onDelete(lessonId, task.id)}
                                    className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-red-600 transition flex items-center justify-center"
                                >
                                    <BsTrash />
                                </button>

                            </div>

                        </div>

                    </div>

                ))}

        </div>

    );

}
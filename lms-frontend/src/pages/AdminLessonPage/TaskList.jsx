import {
    BsCodeSlash,
    BsCardText,
    BsPencilSquare,
    BsTrash,
    BsGripVertical
} from "react-icons/bs";

export default function TaskList({
                                     lessonId,
                                     tasks,
                                     deleteTask,
                                     startEditTask
                                 }) {

    return (

        <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6">

            <div className="flex justify-between items-center mb-5">

                <h2 className="text-2xl font-bold">
                    Zadania
                </h2>

                <span className="text-sm text-gray-400">
                    {tasks?.length || 0} zadań
                </span>

            </div>

            {!tasks || tasks.length === 0 ? (

                <div className="text-center py-10 text-gray-500">

                    Brak zadań w tej lekcji.

                </div>

            ) : (

                <div className="space-y-3">

                    {tasks.map(task => (

                        <div
                            key={task.id}
                            className="bg-gray-800 border border-gray-700 rounded-2xl p-4 flex items-center justify-between hover:border-blue-500 transition"
                        >

                            <div className="flex items-center gap-4">

                                <div className="text-gray-500 cursor-grab">

                                    <BsGripVertical />

                                </div>

                                <div>

                                    <div className="flex items-center gap-2">

                                        <span className="font-semibold">

                                            {task.orderIndex + 1}. {task.taskContent}

                                        </span>

                                    </div>

                                    <div className="flex gap-4 mt-2 text-sm text-gray-400">

                                        <span className="flex items-center gap-1">

                                            {task.type === "CODE"
                                                ? <BsCodeSlash />
                                                : <BsCardText />
                                            }

                                            {task.type}

                                        </span>

                                        {task.language && (

                                            <span>

                                                {task.language}

                                            </span>

                                        )}

                                    </div>

                                </div>

                            </div>

                            <div className="flex gap-2">

                                <button
                                    onClick={() => startEditTask(lessonId, task)}
                                    className="bg-blue-600 hover:bg-blue-700 p-2 rounded-xl transition"
                                >

                                    <BsPencilSquare />

                                </button>

                                <button
                                    onClick={() => deleteTask(lessonId, task.id)}
                                    className="bg-red-600 hover:bg-red-700 p-2 rounded-xl transition"
                                >

                                    <BsTrash />

                                </button>

                            </div>

                        </div>

                    ))}

                </div>

            )}

        </section>

    );

}
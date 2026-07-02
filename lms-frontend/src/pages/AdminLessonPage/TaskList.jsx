export default function TaskList({
                                     lessonId,
                                     tasks,
                                     deleteTask,
                                     startEditTask
                                 }) {

    return (
        <div className="space-y-2">

            <h3 className="font-bold text-yellow-400">
                Zadania
            </h3>

            {(tasks || []).map(task => (

                <div
                    key={task.id}
                    className="bg-gray-900 rounded p-3 flex justify-between"
                >

                    <div>
                        {task.orderIndex}. {task.taskContent}
                    </div>

                    <div className="flex gap-2">

                        <button
                            onClick={() => startEditTask(lessonId, task)}
                        >
                            ✏️
                        </button>

                        <button
                            onClick={() => deleteTask(lessonId, task.id)}
                        >
                            🗑
                        </button>

                    </div>

                </div>

            ))}

        </div>
    );
}
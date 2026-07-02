import TaskManager from "./TaskManager";
import BlockManager from "./BlockManager";

export default function LessonCard({
                                       lesson,
                                       expanded,
                                       toggle,
                                       onEdit,
                                       onDelete,
                                       tasks,
                                       blocks,
                                       taskForm,
                                       editingTaskId,
                                       setTaskForms,
                                       addTask,
                                       updateTask,
                                       deleteTask,
                                       startEditTask,
                                       emptyTaskForm
                                   }) {
    return (
        <div className="bg-gray-800 rounded-xl p-5 space-y-5">

            <div className="flex justify-between items-center">

                <div
                    onClick={() => toggle(lesson.id)}
                    className="cursor-pointer"
                >
                    <h2 className="font-bold">
                        {lesson.orderIndex}. {lesson.title}
                    </h2>
                </div>

                <div className="flex gap-2">

                    <button onClick={() => onEdit(lesson)}>
                        ✏️
                    </button>

                    <button onClick={() => onDelete(lesson.id)}>
                        🗑
                    </button>

                </div>

            </div>

            {expanded && (
                <>
                    <BlockManager
                        lessonId={lesson.id}
                        blocks={blocks}
                    />

                    <TaskManager
                        lessonId={lesson.id}
                        tasks={tasks}
                        form={taskForm}
                        editingTaskId={editingTaskId}
                        setTaskForms={setTaskForms}
                        addTask={addTask}
                        updateTask={updateTask}
                        deleteTask={deleteTask}
                        startEditTask={startEditTask}
                        emptyTaskForm={emptyTaskForm}
                    />
                </>
            )}

        </div>
    );
}
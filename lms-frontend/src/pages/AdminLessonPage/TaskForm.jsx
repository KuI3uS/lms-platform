export default function TaskForm({
                                     lessonId,
                                     form,
                                     editingTaskId,
                                     setTaskForms,
                                     addTask,
                                     updateTask,
                                     emptyTaskForm
                                 }) {

    return (

        <div className="bg-gray-900 rounded-xl p-5 space-y-3">

            <textarea
                value={form?.taskContent || ""}
                placeholder="Treść zadania"
                className="w-full bg-gray-800 rounded p-2"
                onChange={e =>
                    setTaskForms(prev => ({
                        ...prev,
                        [lessonId]: {
                            ...(prev[lessonId] || emptyTaskForm),
                            taskContent: e.target.value
                        }
                    }))
                }
            />

            {/* tutaj reszta inputów */}

            <button
                onClick={() =>
                    editingTaskId
                        ? updateTask(lessonId)
                        : addTask(lessonId)
                }
                className="bg-green-600 px-4 py-2 rounded"
            >
                {editingTaskId ? "Zapisz zadanie" : "Dodaj zadanie"}
            </button>

        </div>

    );

}
import { BsCodeSquare } from "react-icons/bs";

import TaskForm from "./TaskForm";
import TaskList from "./TaskList";

export default function TaskManager({
                                        lessonId,

                                        tasks = [],

                                        form,
                                        editingTaskId,

                                        setTaskForms,

                                        addTask,
                                        updateTask,

                                        deleteTask,
                                        startEditTask,

                                        emptyTaskForm
                                    }) {

    return (

        <section className="bg-gray-950 border border-gray-800 rounded-3xl p-6 space-y-6">

            <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-yellow-500 text-black flex items-center justify-center">

                    <BsCodeSquare />

                </div>

                <div>

                    <h3 className="text-xl font-bold">
                        Zadania
                    </h3>

                    <p className="text-gray-400 text-sm">
                        Dodawaj zadania praktyczne przypisane do tej lekcji.
                    </p>

                </div>

            </div>

            <TaskList
                lessonId={lessonId}
                tasks={tasks}
                deleteTask={deleteTask}
                startEditTask={startEditTask}
            />

            <TaskForm
                lessonId={lessonId}

                form={form}

                editingTaskId={editingTaskId}

                setTaskForms={setTaskForms}

                addTask={addTask}

                updateTask={updateTask}

                emptyTaskForm={emptyTaskForm}
            />

        </section>

    );

}
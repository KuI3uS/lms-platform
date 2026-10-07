import { BsListTask } from "react-icons/bs";

import TaskList from "./TaskList";
import TaskForm from "./TaskForm";

export default function TaskManager({

                                        lessonId,

                                        lessonTasks

                                    }) {

    const tasks = lessonTasks.getTasks(lessonId);

    const task = lessonTasks.getTaskForm(lessonId);

    return (

        <section className="bg-gray-950 border border-gray-800 rounded-3xl p-6 space-y-6">

            <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center">

                    <BsListTask />

                </div>

                <div>

                    <h3 className="text-xl font-bold">
                        Zadania
                    </h3>

                    <p className="text-gray-400 text-sm">
                        Twórz zadania praktyczne dla uczniów.
                    </p>

                </div>

            </div>

            <TaskList

                lessonId={lessonId}

                tasks={tasks}

                onEdit={lessonTasks.editTask}

                onDelete={lessonTasks.deleteTask}

            />

            <TaskForm

                task={task}

                setTask={(callback) =>
                    lessonTasks.setTask(
                        lessonId,
                        callback
                    )
                }

                onSave={() =>
                    task.id
                        ? lessonTasks.updateTask(
                            lessonId
                        )
                        : lessonTasks.createTask(
                            lessonId
                        )
                }

            />

        </section>

    );

}
import TaskForm from "./TaskForm";
import TaskList from "./TaskList";

export default function TaskManager(props) {

    return (
        <div className="space-y-4">

            <TaskList
                lessonId={props.lessonId}
                tasks={props.tasks}
                deleteTask={props.deleteTask}
                startEditTask={props.startEditTask}
            />

            <TaskForm {...props} />

        </div>
    );
}
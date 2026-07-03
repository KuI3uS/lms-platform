import { useState } from "react";
import { apiFetch } from "../../../api/api";

const emptyTask = {
    title: "",
    description: "",
    instruction: "",
    expectedAnswer: "",
    starterCode: "",
    hint: "",
    language: "java",
    type: "CODE",
    points: 0,
    orderIndex: 0,
    published: true
};

export default function useLessonTasks() {

    const [tasksByLesson, setTasksByLesson] = useState({});
    const [taskForms, setTaskForms] = useState({});
    const [editingTaskId, setEditingTaskId] = useState(null);

    async function loadTasks(lessonId) {

        const data = await apiFetch(`/tasks/lesson/${lessonId}`);

        console.log("TASKS:", data);

        setTasksByLesson(prev => ({
            ...prev,
            [lessonId]: data || []
        }));

        if (!taskForms[lessonId]) {
            resetTaskForm(lessonId);
        }
    }

    async function createTask(lessonId) {

        const task = taskForms[lessonId];

        if (!task) return;

        if (!task.title?.trim()) {
            alert("Podaj tytuł zadania.");
            return;
        }

        if (!task.instruction?.trim()) {
            alert("Podaj polecenie.");
            return;
        }

        await apiFetch(`/tasks/lesson/${lessonId}`, {
            method: "POST",
            body: JSON.stringify(task)
        });

        await loadTasks(lessonId);

        resetTaskForm(lessonId);
    }

    async function updateTask(lessonId) {

        const task = taskForms[lessonId];

        if (!task?.id) return;

        await apiFetch(`/tasks/${task.id}`, {
            method: "PUT",
            body: JSON.stringify(task)
        });

        await loadTasks(lessonId);

        resetTaskForm(lessonId);
    }

    async function deleteTask(
        lessonId,
        taskId
    ) {

        if (!window.confirm("Usunąć zadanie?")) {
            return;
        }

        await apiFetch(`/tasks/${taskId}`, {
            method: "DELETE"
        });

        await loadTasks(lessonId);
    }

    function editTask(
        lessonId,
        task
    ) {

        setEditingTaskId(task.id);

        setTaskForms(prev => ({
            ...prev,
            [lessonId]: {
                ...task
            }
        }));
    }

    function resetTaskForm(lessonId) {

        setEditingTaskId(null);

        setTaskForms(prev => ({
            ...prev,
            [lessonId]: {
                ...emptyTask
            }
        }));
    }

    function setTask(
        lessonId,
        callback
    ) {

        setTaskForms(prev => ({

            ...prev,

            [lessonId]:

                typeof callback === "function"
                    ? callback(prev[lessonId] || emptyTask)
                    : callback

        }));
    }

    function getTasks(lessonId) {
        return tasksByLesson[lessonId] || [];
    }

    function getTaskForm(lessonId) {
        return taskForms[lessonId] || emptyTask;
    }

    function isEditingTask(taskId) {
        return editingTaskId === taskId;
    }

    return {

        tasksByLesson,

        taskForms,

        editingTaskId,

        emptyTask,

        loadTasks,

        createTask,

        updateTask,

        deleteTask,

        editTask,

        resetTaskForm,

        setTask,

        getTasks,

        getTaskForm,

        isEditingTask
    };

}
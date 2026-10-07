import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { apiFetch } from "../../api/api";

import ModuleSettings from "./ModuleSettings";
import LessonForm from "./LessonForm";
import LessonCard from "./LessonCard";

export default function AdminLessonPage() {

    const { moduleId } = useParams();

    /*
    |--------------------------------------------------------------------------
    | Lekcje
    |--------------------------------------------------------------------------
    */

    const [lessons, setLessons] = useState([]);

    const [expandedLesson, setExpandedLesson] = useState(null);

    const [editingLessonId, setEditingLessonId] = useState(null);

    const emptyLesson = {
        title: "",
        theory: "",
        example: "",
        content: "",
        imageUrl: "",
        published: true,
        freePreview: false
    };

    const [lessonForm, setLessonForm] = useState(emptyLesson);

    /*
    |--------------------------------------------------------------------------
    | Moduł
    |--------------------------------------------------------------------------
    */

    const [moduleSettings, setModuleSettings] = useState({
        name: "",
        lessonsLocked: false
    });

    /*
    |--------------------------------------------------------------------------
    | Bloki (następna część)
    |--------------------------------------------------------------------------
    */

    const [blocksByLesson, setBlocksByLesson] = useState({});

    const [blockForms, setBlockForms] = useState({});

    /*
    |--------------------------------------------------------------------------
    | Zadania (następna część)
    |--------------------------------------------------------------------------
    */

    const [tasksByLesson, setTasksByLesson] = useState({});

    const [taskForms, setTaskForms] = useState({});

    const [editingTaskId, setEditingTaskId] = useState(null);

    const emptyTaskForm = {
        taskContent: "",
        expectedAnswer: "",
        starterCode: "",
        hint: "",
        language: "java",
        type: "TEXT"
    };

    /*
    |--------------------------------------------------------------------------
    | START
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        loadModule();

        loadLessons();

    }, [moduleId]);

    /*
    |--------------------------------------------------------------------------
    | MODULE
    |--------------------------------------------------------------------------
    */

    async function loadModule() {

        const data = await apiFetch(`/modules/${moduleId}`);

        setModuleSettings({
            name: data.name,
            lessonsLocked: data.lessonsLocked
        });

    }

    async function saveModuleSettings() {

        await apiFetch(`/modules/${moduleId}`, {

            method: "PUT",

            body: JSON.stringify(moduleSettings)

        });

        alert("Ustawienia zapisane.");

    }

    /*
    |--------------------------------------------------------------------------
    | LESSONS
    |--------------------------------------------------------------------------
    */

    async function loadLessons() {

        const data =
            await apiFetch(`/lessons/module/${moduleId}`);

        setLessons(data || []);

    }

    async function createLesson() {

        if (!lessonForm.title.trim()) {

            alert("Podaj nazwę lekcji.");

            return;

        }

        await apiFetch(`/lessons/module/${moduleId}`, {

            method: "POST",

            body: JSON.stringify({

                ...lessonForm,

                orderIndex: lessons.length

            })

        });

        setLessonForm(emptyLesson);

        loadLessons();

    }

    async function updateLesson() {

        await apiFetch(`/lessons/${editingLessonId}`, {

            method: "PUT",

            body: JSON.stringify(lessonForm)

        });

        setEditingLessonId(null);

        setLessonForm(emptyLesson);

        loadLessons();

    }

    async function deleteLesson(id) {

        if (!window.confirm("Usunąć lekcję?")) {

            return;

        }

        await apiFetch(`/lessons/${id}`, {

            method: "DELETE"

        });

        loadLessons();

    }

    function editLesson(lesson) {

        setEditingLessonId(lesson.id);

        setLessonForm({

            ...lesson

        });

    }

    /*
|--------------------------------------------------------------------------
| BLOCKS
|--------------------------------------------------------------------------
*/

    const emptyBlock = {
        title: "",
        type: "TEXT",
        content: "",
        language: "java",
        mediaUrl: "",
        mediaType: "",
        taskId: null,
        published: true,
        points: 0
    };

    async function loadBlocks(lessonId) {

        const data = await apiFetch(
            `/lesson-blocks/lesson/${lessonId}`
        );

        setBlocksByLesson(prev => ({
            ...prev,
            [lessonId]: data || []
        }));

        if (!blockForms[lessonId]) {

            setBlockForms(prev => ({
                ...prev,
                [lessonId]: {
                    ...emptyBlock
                }
            }));

        }

    }

    async function saveBlock(lessonId) {

        const block = blockForms[lessonId];

        if (!block) return;

        if (
            block.type !== "DIVIDER" &&
            (!block.title || !block.title.trim())
        ) {

            alert("Podaj tytuł bloku.");

            return;

        }

        await apiFetch(
            `/lesson-blocks/lesson/${lessonId}`,
            {
                method: "POST",
                body: JSON.stringify(block)
            }
        );

        await loadBlocks(lessonId);

        setBlockForms(prev => ({
            ...prev,
            [lessonId]: {
                ...emptyBlock
            }
        }));

    }

    async function updateBlock(lessonId, blockId) {

        const block = blockForms[lessonId];

        if (!block) return;

        await apiFetch(
            `/lesson-blocks/${blockId}`,
            {
                method: "PUT",
                body: JSON.stringify(block)
            }
        );

        await loadBlocks(lessonId);

        setBlockForms(prev => ({
            ...prev,
            [lessonId]: {
                ...emptyBlock
            }
        }));

    }

    async function deleteBlock(lessonId, blockId) {

        if (!window.confirm("Usunąć blok?")) {

            return;

        }

        await apiFetch(
            `/lesson-blocks/${blockId}`,
            {
                method: "DELETE"
            }
        );

        await loadBlocks(lessonId);

    }

    function editBlock(lessonId, block) {

        setBlockForms(prev => ({
            ...prev,
            [lessonId]: {
                ...block
            }
        }));

    }

    async function toggleLesson(id) {

        if (expandedLesson === id) {

            setExpandedLesson(null);

            return;

        }

        setExpandedLesson(id);

        if (!blocksByLesson[id]) {

            await loadBlocks(id);

        }

        if (!tasksByLesson[id]) {

            await loadTasks(id);

        }

    }

    /*
|--------------------------------------------------------------------------
| TASKS
|--------------------------------------------------------------------------
*/

    async function loadTasks(lessonId) {

        const data = await apiFetch(
            `/tasks/lesson/${lessonId}`
        );

        setTasksByLesson(prev => ({
            ...prev,
            [lessonId]: data || []
        }));

        if (!taskForms[lessonId]) {

            setTaskForms(prev => ({
                ...prev,
                [lessonId]: {
                    ...emptyTaskForm
                }
            }));

        }

    }

    async function addTask(lessonId) {

        const form = taskForms[lessonId];

        if (!form) return;

        if (!form.taskContent.trim()) {

            alert("Podaj treść zadania.");

            return;

        }

        await apiFetch(
            `/tasks/lesson/${lessonId}`,
            {
                method: "POST",
                body: JSON.stringify(form)
            }
        );

        await loadTasks(lessonId);

        setTaskForms(prev => ({
            ...prev,
            [lessonId]: {
                ...emptyTaskForm
            }
        }));

    }

    async function updateTask(lessonId) {

        const form = taskForms[lessonId];

        if (!form?.id) return;

        await apiFetch(
            `/tasks/${form.id}`,
            {
                method: "PUT",
                body: JSON.stringify(form)
            }
        );

        await loadTasks(lessonId);

        setEditingTaskId(null);

        setTaskForms(prev => ({
            ...prev,
            [lessonId]: {
                ...emptyTaskForm
            }
        }));

    }

    async function deleteTask(lessonId, taskId) {

        if (!window.confirm("Usunąć zadanie?")) {

            return;

        }

        await apiFetch(
            `/tasks/${taskId}`,
            {
                method: "DELETE"
            }
        );

        await loadTasks(lessonId);

        /*
            po usunięciu odświeżamy również bloki,
            ponieważ blok TASK może wskazywać na usunięte zadanie
        */

        await loadBlocks(lessonId);

    }

    function startEditTask(lessonId, task) {

        setEditingTaskId(task.id);

        setTaskForms(prev => ({
            ...prev,
            [lessonId]: {
                ...task
            }
        }));

    }

    function cancelTaskEdit(lessonId) {

        setEditingTaskId(null);

        setTaskForms(prev => ({
            ...prev,
            [lessonId]: {
                ...emptyTaskForm
            }
        }));

    }
    /*
|--------------------------------------------------------------------------
| RENDER
|--------------------------------------------------------------------------
*/

    return (

        <div className="max-w-7xl mx-auto text-white space-y-8 pb-20">

            <div>

                <h1 className="text-4xl font-black">
                    Kreator lekcji
                </h1>

                <p className="text-gray-400 mt-2">
                    Twórz profesjonalne lekcje z bloków, przykładów oraz zadań praktycznych.
                </p>

            </div>

            <ModuleSettings
                moduleSettings={moduleSettings}
                setModuleSettings={setModuleSettings}
                onSave={saveModuleSettings}
            />

            <LessonForm
                form={lessonForm}
                setForm={setLessonForm}
                editingId={editingLessonId}
                onCreate={createLesson}
                onUpdate={updateLesson}
            />

            <section className="space-y-6">

                <div className="flex items-center justify-between">

                    <div>

                        <h2 className="text-2xl font-bold">
                            Lekcje
                        </h2>

                        <p className="text-gray-400 mt-1">

                            Kliknij lekcję, aby zarządzać blokami oraz zadaniami.

                        </p>

                    </div>

                    <div className="text-sm text-gray-500">

                        Łącznie: <b>{lessons.length}</b>

                    </div>

                </div>

                {lessons.length === 0 && (

                    <div className="bg-gray-900 border border-dashed border-gray-700 rounded-3xl p-12 text-center">

                        <h3 className="text-xl font-bold">
                            Brak lekcji
                        </h3>

                        <p className="text-gray-500 mt-2">

                            Dodaj pierwszą lekcję korzystając z formularza powyżej.

                        </p>

                    </div>

                )}

                {lessons.map((lesson) => (

                    <LessonCard

                        key={lesson.id}

                        lesson={lesson}

                        expanded={expandedLesson === lesson.id}

                        toggle={toggleLesson}

                        onEdit={editLesson}

                        onDelete={deleteLesson}

                        /*
                        |--------------------------------------------------------------------------
                        | BLOCKS
                        |--------------------------------------------------------------------------
                        */

                        blocks={
                            blocksByLesson[lesson.id] || []
                        }

                        block={
                            blockForms[lesson.id] || emptyBlock
                        }

                        setBlock={(callback) => {

                            setBlockForms(prev => ({

                                ...prev,

                                [lesson.id]:

                                    typeof callback === "function"

                                        ? callback(
                                            prev[lesson.id] || emptyBlock
                                        )

                                        : callback

                            }));

                        }}

                        saveBlock={() =>

                            saveBlock(lesson.id)

                        }

                        /*
                        |--------------------------------------------------------------------------
                        | TASKS
                        |--------------------------------------------------------------------------
                        */

                        tasks={
                            tasksByLesson[lesson.id] || []
                        }

                        taskForm={
                            taskForms[lesson.id] || emptyTaskForm
                        }

                        editingTaskId={editingTaskId}

                        setTaskForms={setTaskForms}

                        addTask={addTask}

                        updateTask={updateTask}

                        deleteTask={deleteTask}

                        startEditTask={startEditTask}

                        emptyTaskForm={emptyTaskForm}

                    />

                ))}

            </section>

        </div>

    );

}
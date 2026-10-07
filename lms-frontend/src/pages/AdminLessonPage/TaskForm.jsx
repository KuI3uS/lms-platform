import {
    BsCodeSlash,
    BsCheckCircle,
    BsLightbulb,
    BsSave,
    BsQuestionCircle
} from "react-icons/bs";

export default function TaskForm({
                                     lessonId,
                                     form,
                                     editingTaskId,
                                     setTaskForms,
                                     addTask,
                                     updateTask,
                                     emptyTaskForm
                                 }) {

    const updateField = (field, value) => {

        setTaskForms(prev => ({
            ...prev,
            [lessonId]: {
                ...(prev[lessonId] || emptyTaskForm),
                [field]: value
            }
        }));

    };

    return (

        <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-5">

            <div>

                <h2 className="text-2xl font-bold">
                    {editingTaskId ? "Edytuj zadanie" : "Nowe zadanie"}
                </h2>

                <p className="text-gray-400 mt-1">
                    Dodaj zadanie praktyczne do lekcji.
                </p>

            </div>

            <select
                value={form?.type || "TEXT"}
                onChange={(e) => updateField("type", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
            >
                <option value="TEXT">Tekst</option>
                <option value="CODE">Kod</option>
            </select>

            <textarea
                value={form?.taskContent || ""}
                placeholder="Treść zadania"
                onChange={(e) => updateField("taskContent", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 min-h-36"
            />

            <div className="space-y-2">

                <label className="flex items-center gap-2 text-sm text-gray-300">

                    <BsCodeSlash />

                    Kod startowy

                </label>

                <textarea
                    value={form?.starterCode || ""}
                    placeholder="Starter Code..."
                    onChange={(e) => updateField("starterCode", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 min-h-56 font-mono"
                />

            </div>

            <input
                value={form?.language || "java"}
                placeholder="Język (java)"
                onChange={(e) => updateField("language", e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
            />

            <div className="space-y-2">

                <label className="flex items-center gap-2 text-sm text-gray-300">

                    <BsCheckCircle />

                    Oczekiwana odpowiedź

                </label>

                <textarea
                    value={form?.expectedAnswer || ""}
                    placeholder="Kod wymagany do zaliczenia..."
                    onChange={(e) => updateField("expectedAnswer", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 min-h-44 font-mono"
                />

            </div>

            <div className="space-y-2">

                <label className="flex items-center gap-2 text-sm text-gray-300">

                    <BsLightbulb />

                    Podpowiedź

                </label>

                <textarea
                    value={form?.hint || ""}
                    placeholder="Opcjonalna podpowiedź..."
                    onChange={(e) => updateField("hint", e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 min-h-28"
                />

            </div>

            <button
                onClick={() =>
                    editingTaskId
                        ? updateTask(lessonId)
                        : addTask(lessonId)
                }
                className="w-full bg-green-600 hover:bg-green-700 rounded-xl py-3 font-bold flex items-center justify-center gap-2 transition"
            >

                <BsSave />

                {editingTaskId
                    ? "Zapisz zadanie"
                    : "Dodaj zadanie"}

            </button>

        </section>

    );

}
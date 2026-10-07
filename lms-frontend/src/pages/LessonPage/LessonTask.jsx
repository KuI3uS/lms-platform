import {
    BsCheckCircleFill,
    BsExclamationCircle,
    BsLightbulb,
    BsArrowRepeat,
    BsPlayFill
} from "react-icons/bs";

import MonacoEditorBox from "./MonacoEditor";

export default function LessonTask({
                                       block,
                                       blocks,
                                       tasks,
                                       answers,
                                       setAnswers,
                                       results,
                                       checkTask
                                   }) {
    const task = tasks.find(t => Number(t.id) === Number(block.taskId));

    const taskNumber = blocks
        .filter(b => b.type === "TASK")
        .findIndex(b => Number(b.id) === Number(block.id)) + 1;

    if (!task) {
        return (
            <section className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-3xl p-8">
                Nie znaleziono zadania dla tego bloku.
            </section>
        );
    }

    const value = answers[task.id] ?? task.starterCode ?? "";
    const result = results[task.id];

    const updateAnswer = (newValue) => {
        setAnswers(prev => ({
            ...prev,
            [task.id]: newValue
        }));
    };

    const resetAnswer = () => {
        setAnswers(prev => ({
            ...prev,
            [task.id]: task.type === "CODE" ? task.starterCode || "" : ""
        }));
    };

    return (
        <section className="rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 via-gray-900 to-gray-950 overflow-hidden">

            <div className="p-8 border-b border-gray-800">
                <p className="text-yellow-300 font-bold mb-2">
                    Zadanie {taskNumber}
                </p>

                <h2 className="text-3xl font-black text-white leading-tight">
                    {block.title || "Ćwiczenie praktyczne"}
                </h2>

                <p className="text-gray-300 mt-5 whitespace-pre-line leading-8 text-lg">
                    {task.taskContent}
                </p>
            </div>

            {task.hint && (
                <div className="mx-8 mt-6 bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 rounded-2xl p-5 flex gap-4">
                    <BsLightbulb className="text-yellow-300 shrink-0 mt-1" size={22} />

                    <div>
                        <p className="font-bold mb-1">
                            Podpowiedź
                        </p>

                        <p className="text-yellow-100/90 whitespace-pre-line">
                            {task.hint}
                        </p>
                    </div>
                </div>
            )}

            <div className="p-8 space-y-6">
                {task.type === "CODE" ? (
                    <MonacoEditorBox
                        language={task.language || "java"}
                        value={value}
                        onChange={updateAnswer}
                    />
                ) : (
                    <textarea
                        className="w-full min-h-72 bg-gray-950 border border-gray-700 rounded-3xl p-6 text-gray-200 outline-none focus:border-blue-500 transition"
                        placeholder="Wpisz swoją odpowiedź..."
                        value={value}
                        onChange={(e) => updateAnswer(e.target.value)}
                    />
                )}

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => checkTask(task.id)}
                        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition"
                    >
                        <BsPlayFill />
                        Sprawdź
                    </button>

                    <button
                        onClick={resetAnswer}
                        className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition"
                    >
                        <BsArrowRepeat />
                        Reset
                    </button>
                </div>

                {result !== undefined && (
                    <div
                        className={`rounded-2xl border p-5 flex gap-4 ${
                            result
                                ? "bg-green-500/10 border-green-500/30 text-green-300"
                                : "bg-red-500/10 border-red-500/30 text-red-300"
                        }`}
                    >
                        {result ? (
                            <BsCheckCircleFill className="shrink-0 mt-1" size={24} />
                        ) : (
                            <BsExclamationCircle className="shrink-0 mt-1" size={24} />
                        )}

                        <div>
                            <p className="font-black">
                                {result ? "Poprawna odpowiedź" : "Odpowiedź wymaga poprawy"}
                            </p>

                            <p className="text-sm opacity-90 mt-1">
                                {result
                                    ? "Świetnie. Możesz przejść dalej albo wysłać całą lekcję do nauczyciela."
                                    : "Sprawdź treść zadania, popraw rozwiązanie i spróbuj ponownie."}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
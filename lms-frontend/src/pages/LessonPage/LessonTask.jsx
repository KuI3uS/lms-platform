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
                                       answers,
                                       setAnswers,
                                       results,
                                       checkTask
                                   }) {

    const value = answers[block.id] ?? block.starterCode ?? "";

    const result = results[block.id];

    function updateAnswer(newValue) {

        setAnswers(prev => ({
            ...prev,
            [block.id]: newValue
        }));

    }

    function resetAnswer() {

        setAnswers(prev => ({
            ...prev,
            [block.id]:
                block.type === "CODE"
                    ? block.starterCode || ""
                    : ""
        }));

    }

    return (

        <section className="rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 via-gray-900 to-gray-950 overflow-hidden">

            <div className="p-8 border-b border-gray-800">

                <p className="text-yellow-300 font-bold mb-2">
                    Zadanie
                </p>

                <h2 className="text-3xl font-black text-white leading-tight">
                    {block.title || "Ćwiczenie praktyczne"}
                </h2>

                {block.description && (

                    <p className="text-gray-400 mt-3 whitespace-pre-line">
                        {block.description}
                    </p>

                )}

                <p className="text-gray-300 mt-5 whitespace-pre-line leading-8 text-lg">
                    {block.instruction}
                </p>

            </div>

            {block.hint && (

                <div className="mx-8 mt-6 bg-yellow-500/10 border border-yellow-500/30 text-yellow-200 rounded-2xl p-5 flex gap-4">

                    <BsLightbulb
                        className="text-yellow-300 shrink-0 mt-1"
                        size={22}
                    />

                    <div>

                        <p className="font-bold mb-1">
                            Podpowiedź
                        </p>

                        <p className="text-yellow-100 whitespace-pre-line">
                            {block.hint}
                        </p>

                    </div>

                </div>

            )}

            <div className="p-8 space-y-6">

                {block.type === "CODE" ? (

                    <MonacoEditorBox
                        language={block.language || "java"}
                        value={value}
                        onChange={updateAnswer}
                    />

                ) : (

                    <textarea
                        className="w-full min-h-72 bg-gray-950 border border-gray-700 rounded-3xl p-6 text-gray-200 outline-none focus:border-blue-500"
                        placeholder="Wpisz swoją odpowiedź..."
                        value={value}
                        onChange={(e)=>updateAnswer(e.target.value)}
                    />

                )}

                <div className="flex flex-wrap gap-3">

                    <button
                        onClick={() => checkTask(block.id)}
                        className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-2xl font-bold flex items-center gap-2"
                    >

                        <BsPlayFill />

                        Sprawdź

                    </button>

                    <button
                        onClick={resetAnswer}
                        className="bg-gray-800 hover:bg-gray-700 px-6 py-3 rounded-2xl font-bold flex items-center gap-2"
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

                        {result
                            ? <BsCheckCircleFill size={24}/>
                            : <BsExclamationCircle size={24}/>
                        }

                        <div>

                            <p className="font-black">

                                {result
                                    ? "Poprawna odpowiedź"
                                    : "Odpowiedź wymaga poprawy"}

                            </p>

                        </div>

                    </div>

                )}

            </div>

        </section>

    );

}
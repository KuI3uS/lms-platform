import {
    BsBook,
    BsCardText,
    BsCodeSlash,
    BsLightbulb,
    BsCheckCircle,
    BsStars,
    BsGlobe,
    BsToggleOn
} from "react-icons/bs";
import MonacoEditorBox from "../../../../pages/LessonPage/MonacoEditor";

export default function TaskBlockForm({

                                          block: task,

                                          setBlock,

                                          onSave

                                      }) {

    function update(field, value) {

        setBlock(prev => ({
            ...prev,
            [field]: value
        }));

    }

    return (

        <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-8">

            <div>

                <h2 className="text-2xl font-bold">

                    {task.id
                        ? "Edytuj zadanie"
                        : "Nowe zadanie"}

                </h2>

                <p className="text-gray-400 mt-1">
                    Skonfiguruj zadanie praktyczne dla uczniów.
                </p>

            </div>

            {/* ------------------------------------------------ */}
            {/* PODSTAWOWE */}
            {/* ------------------------------------------------ */}

            <div className="space-y-5">

                <h3 className="text-lg font-bold border-b border-gray-800 pb-2">
                    Podstawowe informacje
                </h3>

                <div className="space-y-2">

                    <label className="flex items-center gap-2 text-gray-300">

                        <BsBook />

                        Tytuł

                    </label>

                    <input
                        value={task.title || ""}
                        onChange={(e)=>update("title", e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
                        placeholder="Np. Pierwsza zmienna"
                    />

                </div>

                <div className="space-y-2">

                    <label className="flex items-center gap-2 text-gray-300">

                        <BsCardText />

                        Opis

                    </label>

                    <textarea
                        value={task.description || ""}
                        onChange={(e)=>update("description", e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 min-h-28"
                        placeholder="Krótki opis zadania..."
                    />

                </div>

                <div className="space-y-2">

                    <label className="flex items-center gap-2 text-gray-300">

                        <BsCardText />

                        Polecenie

                    </label>

                    <textarea
                        value={task.instruction || ""}
                        onChange={(e)=>update("instruction", e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 min-h-40"
                        placeholder="Treść zadania..."
                    />

                </div>

            </div>

            {/* ------------------------------------------------ */}
            {/* KOD */}
            {/* ------------------------------------------------ */}

            <div className="space-y-5">

                <h3 className="text-lg font-bold border-b border-gray-800 pb-2">
                    Kod
                </h3>

                <div className="space-y-2">

                    <label className="flex items-center gap-2 text-gray-300">
                        <BsCodeSlash />
                        Kod startowy
                    </label>

                    <MonacoEditorBox
                        language={task.language}
                        value={task.starterCode || ""}
                        onChange={(value) => update("starterCode", value)}
                    />

                </div>

                <div className="space-y-2">

                    <label className="flex items-center gap-2 text-gray-300">

                        <BsGlobe />

                        Język

                    </label>

                    <select
                        value={task.language || "java"}
                        onChange={(e)=>update("language", e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
                    >

                        <option value="java">Java</option>

                        <option value="javascript">JavaScript</option>

                        <option value="python">Python</option>

                        <option value="csharp">C#</option>

                    </select>

                </div>

            </div>

            {/* ------------------------------------------------ */}
            {/* SPRAWDZANIE */}
            {/* ------------------------------------------------ */}

            <div className="space-y-5">

                <h3 className="text-lg font-bold border-b border-gray-800 pb-2">
                    Sprawdzanie
                </h3>

                <div className="space-y-2">

                    <label className="flex items-center gap-2 text-gray-300">

                        <BsCheckCircle />

                        Poprawna odpowiedź

                    </label>

                    <MonacoEditorBox
                        language={task.language}
                        value={task.expectedAnswer || ""}
                        onChange={(value) => update("expectedAnswer", value)}
                    />

                </div>

                <div className="space-y-2">

                    <label className="flex items-center gap-2 text-gray-300">

                        <BsLightbulb />

                        Podpowiedź

                    </label>

                    <textarea
                        value={task.hint || ""}
                        onChange={(e)=>update("hint", e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 min-h-32"
                    />

                </div>

            </div>

            {/* ------------------------------------------------ */}
            {/* USTAWIENIA */}
            {/* ------------------------------------------------ */}

            <div className="space-y-5">

                <h3 className="text-lg font-bold border-b border-gray-800 pb-2">
                    Ustawienia
                </h3>

                <div className="grid md:grid-cols-3 gap-4">

                    <div className="space-y-2">

                        <label className="flex items-center gap-2 text-gray-300">

                            <BsStars />

                            XP

                        </label>

                        <input
                            type="number"
                            value={task.points ?? 0}
                            onChange={(e)=>update("points", Number(e.target.value))}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
                        />

                    </div>

                    <div className="space-y-2">

                        <label className="text-gray-300">
                            Typ
                        </label>

                        <select
                            value={task.type || "CODE"}
                            onChange={(e)=>update("type", e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
                        >

                            <option value="CODE">
                                CODE
                            </option>

                            <option value="TEXT">
                                TEXT
                            </option>

                        </select>

                    </div>

                    <div className="flex items-end">

                        <label className="flex items-center gap-3 bg-gray-800 rounded-xl p-4 w-full cursor-pointer">

                            <input
                                type="checkbox"
                                checked={task.published ?? true}
                                onChange={(e)=>update("published", e.target.checked)}
                            />

                            <BsToggleOn />

                            Opublikowane

                        </label>

                    </div>

                </div>

            </div>

            <button
                onClick={onSave}
                className="w-full bg-green-600 hover:bg-green-700 rounded-xl py-4 font-bold transition"
            >

                {task.id
                    ? "Zapisz zmiany"
                    : "Dodaj zadanie"}

            </button>

        </section>

    );

}
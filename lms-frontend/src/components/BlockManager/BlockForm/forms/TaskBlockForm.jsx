import {
    BsBook,
    BsCardText,
    BsCodeSlash,
    BsLightbulb,
    BsCheckCircle,
    BsGlobe
} from "react-icons/bs";
import { lazy, Suspense } from "react";

const MonacoEditorBox = lazy(() => import("../../../../pages/LessonPage/MonacoEditor"));

function EditorLoader() {
    return (
        <div className="flex min-h-72 items-center justify-center rounded-3xl border border-white/10 bg-gray-950 text-gray-400">
            Ładowanie edytora kodu...
        </div>
    );
}

export default function TaskBlockForm({

                                          block: task,

                                          setBlock

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

                    <Suspense fallback={<EditorLoader />}>
                        <MonacoEditorBox
                            language={task.language}
                            value={task.starterCode || ""}
                            onChange={(value) => update("starterCode", value)}
                        />
                    </Suspense>

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

                    <Suspense fallback={<EditorLoader />}>
                        <MonacoEditorBox
                            language={task.language}
                            value={task.expectedAnswer || ""}
                            onChange={(value) => update("expectedAnswer", value)}
                        />
                    </Suspense>

                </div>

                <div className="space-y-2">

                    <label className="flex items-center gap-2 text-gray-300">

                        <BsLightbulb />

                        Podstawowa podpowiedź (1. błędna próba)

                    </label>

                    <textarea
                        value={task.hint || ""}
                        onChange={(e)=>update("hint", e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 min-h-32"
                        placeholder="Delikatnie naprowadź ucznia bez podawania gotowego rozwiązania."
                    />

                </div>

                <div className="space-y-2">

                    <label className="flex items-center gap-2 text-gray-300">

                        <BsLightbulb />

                        Dokładniejsza podpowiedź (od 2. błędnej próby)

                    </label>

                    <textarea
                        value={task.detailedHint || ""}
                        onChange={(e)=>update("detailedHint", e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 min-h-32"
                        placeholder="Wskaż konkretny fragment, składnię albo kolejny krok rozwiązania."
                    />

                </div>

                <div className="space-y-2">

                    <label className="flex items-center gap-2 text-gray-300">

                        <BsCheckCircle />

                        Wyjaśnienie rozwiązania (od 4. błędnej próby)

                    </label>

                    <textarea
                        value={task.solutionExplanation || ""}
                        onChange={(e)=>update("solutionExplanation", e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 min-h-36"
                        placeholder="Wyjaśnij, dlaczego poprawne rozwiązanie działa. System pokaże wtedy również przykładowy kod."
                    />

                </div>

            </div>

        </section>

    );

}

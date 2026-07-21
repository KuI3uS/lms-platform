import {
    BsArrowRepeat,
    BsCheckCircleFill,
    BsExclamationCircle,
    BsLightbulb,
    BsPlayFill
} from "react-icons/bs";
import { lazy, Suspense } from "react";

const MonacoEditorBox = lazy(() => import("./MonacoEditor"));

function EditorLoader() {
    return (
        <div className="flex min-h-72 items-center justify-center rounded-3xl border border-white/10 bg-gray-950 text-gray-400">
            Ładowanie edytora kodu...
        </div>
    );
}

export default function LessonTask({
                                       block,
                                       answers,
                                       result,
                                       checking,
                                       onAnswerChange,
                                       onReset,
                                       onCheck
                                   }) {

    const value = answers[block.id] ?? block.starterCode ?? "";
    const isCodeTask = Boolean(block.language || block.starterCode);

    return (
        <section className="overflow-hidden rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 via-gray-900 to-gray-950">
            <div className="border-b border-gray-800 p-5 sm:p-8">
                <p className="mb-2 font-bold text-yellow-300">Zadanie</p>
                <h2 className="text-2xl font-black leading-tight text-white sm:text-3xl">
                    {block.title || "Ćwiczenie praktyczne"}
                </h2>

                {block.description && (
                    <p className="mt-3 whitespace-pre-line text-gray-400">
                        {block.description}
                    </p>
                )}

                <p className="mt-5 whitespace-pre-line text-base leading-7 text-gray-300 sm:text-lg sm:leading-8">
                    {block.instruction}
                </p>
            </div>

            <div className="space-y-6 p-4 sm:p-8">
                {isCodeTask ? (
                    <Suspense fallback={<EditorLoader />}>
                        <MonacoEditorBox
                            language={block.language || "java"}
                            value={value}
                            onChange={(newValue) => onAnswerChange(block.id, newValue)}
                        />
                    </Suspense>
                ) : (
                    <textarea
                        className="min-h-72 w-full rounded-3xl border border-gray-700 bg-gray-950 p-6 text-gray-200 outline-none focus:border-blue-500"
                        placeholder="Wpisz swoją odpowiedź..."
                        value={value}
                        onChange={(event) => onAnswerChange(block.id, event.target.value)}
                    />
                )}

                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        disabled={checking}
                        onClick={() => onCheck(block.id)}
                        className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-bold transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
                    >
                        <BsPlayFill />
                        {checking ? "Sprawdzam..." : "Sprawdź"}
                    </button>

                    <button
                        type="button"
                        disabled={checking}
                        onClick={() => onReset(block)}
                        className="flex items-center gap-2 rounded-2xl bg-gray-800 px-6 py-3 font-bold transition hover:bg-gray-700 disabled:opacity-60"
                    >
                        <BsArrowRepeat />
                        Reset
                    </button>
                </div>

                {result && (
                    <div
                        className={`rounded-2xl border p-5 ${
                            result.correct
                                ? "border-green-500/30 bg-green-500/10 text-green-200"
                                : "border-red-500/30 bg-red-500/10 text-red-200"
                        }`}
                    >
                        <div className="flex gap-4">
                            {result.correct
                                ? <BsCheckCircleFill className="mt-0.5 shrink-0" size={24}/>
                                : <BsExclamationCircle className="mt-0.5 shrink-0" size={24}/>
                            }

                            <div className="min-w-0 flex-1">
                                <p className="font-black">
                                    {result.correct ? "Poprawna odpowiedź" : "Rozwiązanie wymaga poprawy"}
                                </p>
                                <p className="mt-1 text-sm sm:text-base">{result.message}</p>

                                {result.attemptCount > 0 && (
                                    <p className="mt-2 text-xs opacity-70">
                                        Próba {result.attemptCount}
                                    </p>
                                )}
                            </div>
                        </div>

                        {!result.correct && result.diagnostics?.length > 0 && (
                            <ul className="mt-5 space-y-3 border-t border-white/10 pt-5">
                                {result.diagnostics.map((diagnostic, index) => (
                                    <li key={`${diagnostic.type}-${diagnostic.line}-${index}`} className="rounded-xl bg-black/20 p-4">
                                        <p className="font-semibold">
                                            {diagnostic.line ? `Linia ${diagnostic.line}: ` : ""}
                                            {diagnostic.message}
                                        </p>
                                        {diagnostic.suggestion && (
                                            <p className="mt-2 text-sm text-yellow-100">
                                                Jak poprawić: {diagnostic.suggestion}
                                            </p>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {!result.correct && result.hint && (
                            <div className="mt-5 flex gap-3 rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-yellow-100">
                                <BsLightbulb className="mt-0.5 shrink-0 text-yellow-300" size={20}/>
                                <div>
                                    <p className="font-bold">
                                        {result.hintLevel >= 3 ? "Wyjaśnienie rozwiązania" : "Podpowiedź"}
                                    </p>
                                    <p className="mt-1 whitespace-pre-line text-sm sm:text-base">{result.hint}</p>
                                </div>
                            </div>
                        )}

                        {!result.correct && result.solutionPreview && (
                            <div className="mt-5">
                                <p className="mb-2 font-bold text-yellow-100">Przykładowe poprawne rozwiązanie</p>
                                <pre className="overflow-x-auto rounded-xl border border-white/10 bg-gray-950 p-4 text-sm text-gray-100">
                                    <code>{result.solutionPreview}</code>
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}

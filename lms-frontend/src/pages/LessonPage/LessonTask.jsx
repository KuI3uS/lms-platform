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

const DIAGNOSTIC_LABELS = {
    EMPTY_ANSWER: "Brak odpowiedzi",
    INVALID_JAVA_STATEMENT: "Niepoprawna instrukcja",
    INCORRECT_QUIZ_ANSWER: "Niepoprawna odpowiedź",
    INCORRECT_TEXT_ANSWER: "Spróbuj jeszcze raz",
    MISSING_OUTPUT: "Brak wyniku programu",
    MISSING_SEMICOLON: "Brak średnika",
    MISSING_REQUIRED_ELEMENT: "Niepełne rozwiązanie",
    MISSING_REQUIRED_COMMENT: "Brak wymaganego komentarza",
    INCORRECT_COMMENT_COUNT: "Nieprawidłowa liczba komentarzy",
    UNCHANGED_STARTER: "Nieuzupełniony szablon",
    UNBALANCED_DELIMITER: "Niedomknięty znak",
    UNCLOSED_STRING: "Niedomknięty tekst"
};

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
                        className="min-h-40 w-full rounded-3xl border border-gray-700 bg-gray-950 p-6 text-gray-200 outline-none focus:border-blue-500"
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
                        className={`overflow-hidden rounded-3xl border ${
                            result.correct
                                ? "border-emerald-400/30 bg-emerald-500/[0.08]"
                                : "border-orange-400/30 bg-slate-950/70"
                        }`}
                    >
                        <div className="flex items-start gap-4 border-b border-white/10 p-5 sm:p-6">
                            <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
                                result.correct
                                    ? "bg-emerald-500/15 text-emerald-300"
                                    : "bg-orange-500/15 text-orange-300"
                            }`}>
                                {result.correct
                                    ? <BsCheckCircleFill size={22}/>
                                    : <BsExclamationCircle size={22}/>
                                }
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className={`text-lg font-black ${
                                        result.correct ? "text-emerald-200" : "text-white"
                                    }`}>
                                        {result.correct
                                            ? isCodeTask
                                                ? "Dobra robota — kod działa"
                                                : "Dobra robota — odpowiedź jest poprawna"
                                            : isCodeTask
                                                ? "Sprawdź wskazane miejsca"
                                                : "Spróbuj poprawić odpowiedź"}
                                    </p>
                                    {result.attemptCount > 0 && (
                                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-400">
                                            Próba {result.attemptCount}
                                        </span>
                                    )}
                                </div>
                                <p className={`mt-1 text-sm sm:text-base ${
                                    result.correct ? "text-emerald-100/80" : "text-slate-400"
                                }`}>
                                    {result.message}
                                </p>
                                {result.correct && result.xpEarned > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-black text-blue-200">
                                            +{result.xpEarned} XP
                                        </span>
                                        <span className="rounded-full bg-orange-500/15 px-3 py-1 text-xs font-black text-orange-200">
                                            Seria {result.taskStreak} · x{result.xpMultiplier}
                                        </span>
                                        {result.levelUp && (
                                            <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-black text-violet-200">
                                                Nowy poziom {result.level}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {!result.correct && result.diagnostics?.length > 0 && (
                            <ul className="space-y-3 p-4 sm:p-5">
                                {result.diagnostics.map((diagnostic, index) => (
                                    <li
                                        key={`${diagnostic.type}-${diagnostic.line}-${index}`}
                                        className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                                    >
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="grid h-7 w-7 place-items-center rounded-lg bg-orange-500/15 text-xs font-black text-orange-200">
                                                {index + 1}
                                            </span>
                                            <p className="font-black text-white">
                                                {DIAGNOSTIC_LABELS[diagnostic.type] || "Element do poprawy"}
                                            </p>
                                            {diagnostic.line && (
                                                <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-200">
                                                    Linia {diagnostic.line}
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-3 leading-6 text-slate-300">
                                            {diagnostic.message}
                                        </p>
                                        {diagnostic.suggestion && (
                                            <div className="mt-3 rounded-xl bg-cyan-500/10 px-4 py-3 text-sm leading-6 text-cyan-100">
                                                <strong>Jak poprawić:</strong> {diagnostic.suggestion}
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {!result.correct && result.hint && (
                            <div className="mx-4 mb-4 flex gap-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-yellow-100 sm:mx-5 sm:mb-5">
                                <BsLightbulb className="mt-0.5 shrink-0 text-yellow-300" size={20}/>
                                <div>
                                    <p className="font-bold">
                                        {result.hintLevel >= 3
                                            ? "Wyjaśnienie rozwiązania"
                                            : result.hintLevel >= 2
                                                ? "Większa podpowiedź"
                                                : "Wskazówka"}
                                    </p>
                                    <p className="mt-1 whitespace-pre-line text-sm sm:text-base">{result.hint}</p>
                                </div>
                            </div>
                        )}

                        {!result.correct && result.solutionPreview && (
                            <div className="mx-4 mb-4 sm:mx-5 sm:mb-5">
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

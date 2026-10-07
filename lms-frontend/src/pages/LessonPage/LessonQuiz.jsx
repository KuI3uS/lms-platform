import {
    BsArrowRepeat,
    BsCheckCircleFill,
    BsExclamationCircle,
    BsLightbulb,
    BsQuestionCircle
} from "react-icons/bs";

export default function LessonQuiz({
                                       block,
                                       answers,
                                       result,
                                       checking,
                                       onAnswerChange,
                                       onReset,
                                       onCheck
                                   }) {
    const options = (block.content || "")
        .split("\n")
        .map(option => option.trim())
        .filter(Boolean);
    const answer = answers[block.id] || "";

    return (
        <section className="overflow-hidden rounded-3xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/10 via-gray-900 to-gray-950">
            <header className="border-b border-white/10 p-5 sm:p-7">
                <div className="flex items-start gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-500/15 text-2xl text-indigo-200">
                        <BsQuestionCircle />
                    </div>
                    <div>
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-indigo-300">
                            Quiz
                        </p>
                        <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">
                            {block.title || "Wybierz poprawną odpowiedź"}
                        </h2>
                        {block.description && (
                            <p className="mt-3 leading-7 text-gray-400">
                                {block.description}
                            </p>
                        )}
                    </div>
                </div>
            </header>

            <div className="space-y-5 p-5 sm:p-7">
                <div className="grid gap-3">
                    {options.map((option, index) => {
                        const selected = answer === option;
                        return (
                            <button
                                key={`${option}-${index}`}
                                type="button"
                                onClick={() => onAnswerChange(block.id, option)}
                                className={`flex items-center gap-4 rounded-2xl border p-4 text-left transition ${
                                    selected
                                        ? "border-indigo-300 bg-indigo-500/20 text-white"
                                        : "border-white/10 bg-white/[0.03] text-gray-300 hover:border-indigo-400/40 hover:bg-indigo-500/10"
                                }`}
                            >
                                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl font-black ${
                                    selected
                                        ? "bg-indigo-400 text-indigo-950"
                                        : "bg-white/5 text-gray-400"
                                }`}>
                                    {String.fromCharCode(65 + index)}
                                </span>
                                <span className="font-semibold">{option}</span>
                            </button>
                        );
                    })}
                </div>

                {options.length < 2 && (
                    <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-amber-200">
                        Administrator nie skonfigurował jeszcze odpowiedzi do tego quizu.
                    </p>
                )}

                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        disabled={checking || !answer}
                        onClick={() => onCheck(block.id)}
                        className="rounded-2xl bg-indigo-500 px-6 py-3 font-black transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {checking ? "Sprawdzam..." : "Sprawdź odpowiedź"}
                    </button>
                    <button
                        type="button"
                        disabled={checking}
                        onClick={() => onReset(block)}
                        className="flex items-center gap-2 rounded-2xl bg-gray-800 px-5 py-3 font-bold transition hover:bg-gray-700"
                    >
                        <BsArrowRepeat />
                        Reset
                    </button>
                </div>

                {result && (
                    <div className={`rounded-2xl border p-5 ${
                        result.correct
                            ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                            : "border-orange-400/30 bg-orange-500/10 text-orange-100"
                    }`}>
                        <div className="flex items-start gap-3">
                            {result.correct
                                ? <BsCheckCircleFill className="mt-0.5 shrink-0" size={22} />
                                : <BsExclamationCircle className="mt-0.5 shrink-0" size={22} />
                            }
                            <div>
                                <p className="font-black">
                                    {result.correct ? "Poprawna odpowiedź" : "Spróbuj jeszcze raz"}
                                </p>
                                <p className="mt-1 text-sm opacity-80">{result.message}</p>
                            </div>
                        </div>

                        {!result.correct && result.hint && (
                            <div className="mt-4 flex gap-3 rounded-xl bg-black/15 p-4">
                                <BsLightbulb className="mt-0.5 shrink-0 text-yellow-300" />
                                <p className="text-sm leading-6">{result.hint}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}

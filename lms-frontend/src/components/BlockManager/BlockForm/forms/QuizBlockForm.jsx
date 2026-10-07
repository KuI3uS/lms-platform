import {
    BsCheckCircleFill,
    BsQuestionCircle
} from "react-icons/bs";

export default function QuizBlockForm({ block, setBlock }) {
    function parseAnswers(value) {
        return (value || "")
            .split("\n")
            .map(answer => answer.trim())
            .filter(Boolean);
    }

    const answers = parseAnswers(block.content);

    function update(field, value) {
        setBlock(previous => ({ ...previous, [field]: value }));
    }

    function updateAnswers(value) {
        const nextAnswers = parseAnswers(value);

        setBlock(previous => ({
            ...previous,
            content: value,
            expectedAnswer: nextAnswers.includes(previous.expectedAnswer)
                ? previous.expectedAnswer
                : ""
        }));
    }

    return (
        <section className="space-y-5 rounded-3xl border border-indigo-500/25 bg-indigo-500/10 p-5 sm:p-6">
            <div className="flex items-center gap-3 text-indigo-100">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-400/15 text-xl">
                    <BsQuestionCircle />
                </div>
                <div>
                    <h3 className="font-black">Quiz jednokrotnego wyboru</h3>
                    <p className="text-sm text-gray-400">Uczeń wybierze jedną odpowiedź, a system sprawdzi wynik.</p>
                </div>
            </div>

            <label className="block space-y-2">
                <span className="font-semibold">Pytanie</span>
                <input
                    value={block.title || ""}
                    onChange={event => update("title", event.target.value)}
                    placeholder="Np. Który typ przechowuje liczbę całkowitą?"
                    className="w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-indigo-300/50"
                />
            </label>

            <label className="block space-y-2">
                <span className="font-semibold">Wprowadzenie (opcjonalnie)</span>
                <textarea
                    value={block.description || ""}
                    onChange={event => update("description", event.target.value)}
                    placeholder="Dodaj kontekst do pytania."
                    className="min-h-20 w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-indigo-300/50"
                />
            </label>

            <label className="block space-y-2">
                <span className="font-semibold">Odpowiedzi — każda w nowym wierszu</span>
                <textarea
                    value={block.content || ""}
                    onChange={event => updateAnswers(event.target.value)}
                    placeholder={"String\nint\nboolean\nchar"}
                    className="min-h-36 w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 leading-7 outline-none focus:border-indigo-300/50"
                />
                <span className="block text-xs leading-5 text-indigo-200/70">
                    Po wpisaniu odpowiedzi zaznacz poniżej tę, która jest poprawna.
                </span>
            </label>

            <fieldset className="space-y-3">
                <legend className="font-semibold">
                    Zaznacz poprawną odpowiedź
                </legend>
                <p className="text-xs text-gray-400">
                    Zielone oznaczenie widzi tylko administrator. Uczeń nie otrzyma odpowiedzi przed sprawdzeniem quizu.
                </p>

                {answers.length >= 2 && (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {answers.map((answer, index) => (
                            <label
                                key={`${answer}-${index}`}
                                className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
                                    block.expectedAnswer === answer
                                        ? "border-emerald-400/60 bg-emerald-500/15 text-emerald-50 shadow-lg shadow-emerald-950/20"
                                        : "border-white/10 bg-gray-950/60 text-gray-300 hover:border-indigo-300/40 hover:bg-indigo-500/10"
                                }`}
                            >
                                <input
                                    type="radio"
                                    name={`quiz-answer-${block.id || "new"}`}
                                    value={answer}
                                    checked={block.expectedAnswer === answer}
                                    onChange={() => update("expectedAnswer", answer)}
                                    className="sr-only"
                                />
                                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black ${
                                    block.expectedAnswer === answer
                                        ? "bg-emerald-400 text-emerald-950"
                                        : "bg-white/[0.06] text-gray-400"
                                }`}>
                                    {String.fromCharCode(65 + index)}
                                </span>
                                <span className="min-w-0 flex-1 font-semibold">
                                    {answer}
                                </span>
                                {block.expectedAnswer === answer && (
                                    <span className="flex shrink-0 items-center gap-1.5 text-xs font-black uppercase tracking-wide text-emerald-300">
                                        <BsCheckCircleFill />
                                        Poprawna
                                    </span>
                                )}
                            </label>
                        ))}
                    </div>
                )}

                {answers.length < 2 && (
                    <p className="rounded-xl border border-amber-400/20 bg-amber-500/10 p-3 text-xs text-amber-200">
                        Dodaj przynajmniej dwie odpowiedzi, aby skonfigurować quiz.
                    </p>
                )}
            </fieldset>

            <div className="grid gap-4 lg:grid-cols-2">
                <label className="block space-y-2">
                    <span className="font-semibold">Wskazówka po pierwszym błędzie</span>
                    <textarea
                        value={block.hint || ""}
                        onChange={event => update("hint", event.target.value)}
                        placeholder="Naprowadź ucznia bez podawania odpowiedzi."
                        className="min-h-24 w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-indigo-300/50"
                    />
                </label>

                <label className="block space-y-2">
                    <span className="font-semibold">Wyjaśnienie po kolejnych próbach</span>
                    <textarea
                        value={block.detailedHint || ""}
                        onChange={event => update("detailedHint", event.target.value)}
                        placeholder="Wyjaśnij regułę potrzebną do odpowiedzi."
                        className="min-h-24 w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-indigo-300/50"
                    />
                </label>
            </div>
        </section>
    );
}

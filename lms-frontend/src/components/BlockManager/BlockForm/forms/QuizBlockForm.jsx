import { BsQuestionCircle } from "react-icons/bs";

export default function QuizBlockForm({ block, setBlock }) {
    const answers = (block.content || "")
        .split("\n")
        .map(answer => answer.trim())
        .filter(Boolean);

    function update(field, value) {
        setBlock(previous => ({ ...previous, [field]: value }));
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
                    onChange={event => update("content", event.target.value)}
                    placeholder={"String\nint\nboolean\nchar"}
                    className="min-h-36 w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 leading-7 outline-none focus:border-indigo-300/50"
                />
            </label>

            <label className="block space-y-2">
                <span className="font-semibold">Poprawna odpowiedź</span>
                <select
                    value={block.expectedAnswer || ""}
                    onChange={event => update("expectedAnswer", event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-indigo-300/50"
                >
                    <option value="">Wybierz poprawną odpowiedź</option>
                    {answers.map((answer, index) => (
                        <option key={`${answer}-${index}`} value={answer}>{answer}</option>
                    ))}
                </select>
                {answers.length < 2 && (
                    <p className="text-xs text-amber-200">
                        Dodaj przynajmniej dwie odpowiedzi, aby skonfigurować quiz.
                    </p>
                )}
            </label>

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

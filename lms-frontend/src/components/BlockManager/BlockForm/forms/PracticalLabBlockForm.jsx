import { BsBullseye, BsCheck2Square, BsLaptop, BsLightbulb } from "react-icons/bs";

export default function PracticalLabBlockForm({ block, setBlock }) {
    function update(field, value) {
        setBlock(previous => ({ ...previous, [field]: value }));
    }

    return (
        <section className="space-y-6 rounded-3xl border border-emerald-500/25 bg-emerald-500/[0.08] p-5 sm:p-6">
            <div>
                <h2 className="text-2xl font-black text-emerald-100">
                    {block.id ? "Edytuj laboratorium praktyczne" : "Nowe laboratorium praktyczne"}
                </h2>
                <p className="mt-1 text-gray-400">
                    Praca wykonywana poza EduHub, np. w IntelliJ, terminalu, GitHubie, Postmanie lub Dockerze.
                </p>
            </div>

            <label className="block space-y-2">
                <span className="font-bold">Tytuł laboratorium</span>
                <input
                    value={block.title || ""}
                    onChange={event => update("title", event.target.value)}
                    placeholder="Np. Pierwszy commit i push do GitHuba"
                    className="w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-emerald-300/50"
                />
            </label>

            <label className="block space-y-2">
                <span className="flex items-center gap-2 font-bold"><BsLaptop /> Środowisko i sytuacja</span>
                <textarea
                    value={block.description || ""}
                    onChange={event => update("description", event.target.value)}
                    placeholder="Opisz narzędzia, przygotowany projekt, rolę ucznia i kontekst zadania."
                    className="min-h-28 w-full rounded-xl border border-white/10 bg-gray-950/70 p-4 outline-none focus:border-emerald-300/50"
                />
            </label>

            <label className="block space-y-2">
                <span className="flex items-center gap-2 font-bold"><BsBullseye /> Cel i wymagania</span>
                <textarea
                    value={block.instruction || ""}
                    onChange={event => update("instruction", event.target.value)}
                    placeholder={"Cel:\n...\n\nWymagania:\n- ...\n- ..."}
                    className="min-h-52 w-full rounded-xl border border-white/10 bg-gray-950/70 p-4 outline-none focus:border-emerald-300/50"
                />
            </label>

            <label className="block space-y-2">
                <span className="flex items-center gap-2 font-bold"><BsCheck2Square /> Weryfikacja i kryteria ukończenia</span>
                <textarea
                    value={block.content || ""}
                    onChange={event => update("content", event.target.value)}
                    placeholder={"Jak sprawdzić rezultat:\n1. ...\n2. ...\n\nLaboratorium jest ukończone, gdy:\n- ..."}
                    className="min-h-52 w-full rounded-xl border border-white/10 bg-gray-950/70 p-4 outline-none focus:border-emerald-300/50"
                />
            </label>

            <div className="grid gap-4 lg:grid-cols-2">
                <label className="block space-y-2">
                    <span className="flex items-center gap-2 font-bold"><BsLightbulb /> Mała podpowiedź</span>
                    <textarea
                        value={block.hint || ""}
                        onChange={event => update("hint", event.target.value)}
                        placeholder="Naprowadzenie bez podawania gotowej komendy."
                        className="min-h-28 w-full rounded-xl border border-white/10 bg-gray-950/70 p-4 outline-none focus:border-emerald-300/50"
                    />
                </label>
                <label className="block space-y-2">
                    <span className="flex items-center gap-2 font-bold"><BsLightbulb /> Dokładniejsza pomoc</span>
                    <textarea
                        value={block.detailedHint || ""}
                        onChange={event => update("detailedHint", event.target.value)}
                        placeholder="Konkretna wskazówka dla ucznia, który utknął."
                        className="min-h-28 w-full rounded-xl border border-white/10 bg-gray-950/70 p-4 outline-none focus:border-emerald-300/50"
                    />
                </label>
            </div>
        </section>
    );
}

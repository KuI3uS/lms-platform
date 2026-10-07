import { BsQuote } from "react-icons/bs";

export default function QuoteBlockForm({ block, setBlock }) {
    function update(field, value) {
        setBlock(previous => ({ ...previous, [field]: value }));
    }

    return (
        <section className="space-y-5 rounded-3xl border border-orange-500/25 bg-orange-500/10 p-5 sm:p-6">
            <div className="flex items-center gap-3 text-orange-100">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-orange-400/15 text-xl">
                    <BsQuote />
                </div>
                <div>
                    <h3 className="font-black">Wyróżniony cytat</h3>
                    <p className="text-sm text-gray-400">Zapisz wypowiedź oraz jej autora lub źródło.</p>
                </div>
            </div>

            <label className="block space-y-2">
                <span className="font-semibold">Treść cytatu</span>
                <textarea
                    value={block.content || ""}
                    onChange={event => update("content", event.target.value)}
                    placeholder="Najpierw rozwiąż problem. Potem napisz kod."
                    className="min-h-36 w-full rounded-2xl border border-white/10 bg-gray-950/70 p-4 text-lg italic leading-8 outline-none focus:border-orange-300/50"
                />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
                <label className="block space-y-2">
                    <span className="font-semibold">Autor lub źródło</span>
                    <input
                        value={block.description || ""}
                        onChange={event => update("description", event.target.value)}
                        placeholder="Np. John Johnson"
                        className="w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-orange-300/50"
                    />
                </label>

                <label className="block space-y-2">
                    <span className="font-semibold">Nagłówek cytatu</span>
                    <input
                        value={block.title || ""}
                        onChange={event => update("title", event.target.value)}
                        placeholder="Myśl na dziś"
                        className="w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-orange-300/50"
                    />
                </label>
            </div>
        </section>
    );
}

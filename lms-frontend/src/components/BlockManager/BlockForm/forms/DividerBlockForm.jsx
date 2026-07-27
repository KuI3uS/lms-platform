import { BsDashLg } from "react-icons/bs";

export default function DividerBlockForm({ block, setBlock }) {
    function update(field, value) {
        setBlock(previous => ({ ...previous, [field]: value }));
    }

    return (
        <section className="space-y-5 rounded-3xl border border-gray-500/25 bg-gray-500/10 p-5 sm:p-6">
            <div className="flex items-center gap-3 text-gray-100">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-gray-400/15 text-xl">
                    <BsDashLg />
                </div>
                <div>
                    <h3 className="font-black">Separator sekcji</h3>
                    <p className="text-sm text-gray-400">Może być samą linią albo zapowiadać kolejną część lekcji.</p>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                <label className="block space-y-2">
                    <span className="font-semibold">Nazwa kolejnej części (opcjonalnie)</span>
                    <input
                        value={block.title || ""}
                        onChange={event => update("title", event.target.value)}
                        placeholder="Np. Czas na praktykę"
                        className="w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-gray-300/50"
                    />
                </label>

                <label className="block space-y-2">
                    <span className="font-semibold">Styl</span>
                    <select
                        value={block.mediaType || "gradient"}
                        onChange={event => update("mediaType", event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-gray-300/50"
                    >
                        <option value="gradient">Gradient</option>
                        <option value="line">Cienka linia</option>
                        <option value="dots">Kropki</option>
                    </select>
                </label>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gray-950/60 px-6 py-8 text-center">
                {block.title && (
                    <p className="mb-3 text-sm font-black uppercase tracking-[0.25em] text-gray-300">
                        {block.title}
                    </p>
                )}
                <div className="h-px bg-gradient-to-r from-transparent via-gray-400 to-transparent" />
            </div>
        </section>
    );
}

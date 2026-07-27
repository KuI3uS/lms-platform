import { BsImage } from "react-icons/bs";

export default function ImageBlockForm({ block, setBlock }) {
    function update(field, value) {
        setBlock(previous => ({ ...previous, [field]: value }));
    }

    return (
        <section className="space-y-5 rounded-3xl border border-fuchsia-500/25 bg-fuchsia-500/10 p-5 sm:p-6">
            <div className="flex items-center gap-3 text-fuchsia-100">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-fuchsia-400/15 text-xl">
                    <BsImage />
                </div>
                <div>
                    <h3 className="font-black">Materiał graficzny</h3>
                    <p className="text-sm text-gray-400">Dodaj tytuł, objaśnienie i adres obrazu.</p>
                </div>
            </div>

            <label className="block space-y-2">
                <span className="font-semibold">Tytuł grafiki</span>
                <input
                    value={block.title || ""}
                    onChange={event => update("title", event.target.value)}
                    placeholder="Np. Schemat działania pętli"
                    className="w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-fuchsia-300/50"
                />
            </label>

            <label className="block space-y-2">
                <span className="font-semibold">Opis pod grafiką</span>
                <textarea
                    value={block.description || ""}
                    onChange={event => update("description", event.target.value)}
                    placeholder="Wyjaśnij, na co uczeń powinien zwrócić uwagę."
                    className="min-h-24 w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-fuchsia-300/50"
                />
            </label>

            <label className="block space-y-2">
                <span className="font-semibold">Adres obrazu</span>
                <input
                    value={block.mediaUrl || ""}
                    onChange={event => setBlock(previous => ({
                        ...previous,
                        mediaUrl: event.target.value,
                        mediaType: "image"
                    }))}
                    placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-fuchsia-300/50"
                />
            </label>

            {block.mediaUrl && (
                <div className="overflow-hidden rounded-2xl border border-fuchsia-400/20 bg-gray-950/70 p-3">
                    <img
                        src={block.mediaUrl}
                        alt=""
                        className="max-h-64 w-full rounded-xl object-contain"
                    />
                </div>
            )}
        </section>
    );
}

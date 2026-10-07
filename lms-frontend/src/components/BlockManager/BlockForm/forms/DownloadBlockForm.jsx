import { BsDownload } from "react-icons/bs";

export default function DownloadBlockForm({ block, setBlock }) {
    function update(field, value) {
        setBlock(previous => ({ ...previous, [field]: value }));
    }

    return (
        <section className="space-y-5 rounded-3xl border border-cyan-500/25 bg-cyan-500/10 p-5 sm:p-6">
            <div className="flex items-center gap-3 text-cyan-100">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-400/15 text-xl">
                    <BsDownload />
                </div>
                <div>
                    <h3 className="font-black">Plik do pobrania</h3>
                    <p className="text-sm text-gray-400">Dodaj nazwę, opis oraz bezpośredni adres dokumentu.</p>
                </div>
            </div>

            <label className="block space-y-2">
                <span className="font-semibold">Nazwa pliku</span>
                <input
                    value={block.title || ""}
                    onChange={event => update("title", event.target.value)}
                    placeholder="Np. Ściąga — podstawy Javy.pdf"
                    className="w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-cyan-300/50"
                />
            </label>

            <label className="block space-y-2">
                <span className="font-semibold">Opis załącznika</span>
                <textarea
                    value={block.description || ""}
                    onChange={event => update("description", event.target.value)}
                    placeholder="Napisz, co znajduje się w pliku."
                    className="min-h-24 w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-cyan-300/50"
                />
            </label>

            <label className="block space-y-2">
                <span className="font-semibold">Adres pliku</span>
                <input
                    value={block.mediaUrl || ""}
                    onChange={event => setBlock(previous => ({
                        ...previous,
                        mediaUrl: event.target.value,
                        mediaType: "file"
                    }))}
                    placeholder="https://.../material.pdf"
                    className="w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-cyan-300/50"
                />
            </label>
        </section>
    );
}

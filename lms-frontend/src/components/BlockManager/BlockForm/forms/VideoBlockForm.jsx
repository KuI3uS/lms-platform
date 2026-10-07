import { BsPlayBtn } from "react-icons/bs";

export default function VideoBlockForm({ block, setBlock }) {
    function update(field, value) {
        setBlock(previous => ({ ...previous, [field]: value }));
    }

    return (
        <section className="space-y-5 rounded-3xl border border-rose-500/25 bg-rose-500/10 p-5 sm:p-6">
            <div className="flex items-center gap-3 text-rose-100">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-rose-400/15 text-xl">
                    <BsPlayBtn />
                </div>
                <div>
                    <h3 className="font-black">Materiał wideo</h3>
                    <p className="text-sm text-gray-400">Obsługuje YouTube i bezpośrednie adresy plików wideo.</p>
                </div>
            </div>

            <label className="block space-y-2">
                <span className="font-semibold">Tytuł filmu</span>
                <input
                    value={block.title || ""}
                    onChange={event => update("title", event.target.value)}
                    placeholder="Np. Zobacz, jak działa pętla for"
                    className="w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-rose-300/50"
                />
            </label>

            <label className="block space-y-2">
                <span className="font-semibold">Opis przed filmem</span>
                <textarea
                    value={block.description || ""}
                    onChange={event => update("description", event.target.value)}
                    placeholder="Napisz, czego uczeń dowie się z nagrania."
                    className="min-h-24 w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-rose-300/50"
                />
            </label>

            <label className="block space-y-2">
                <span className="font-semibold">Link do filmu</span>
                <input
                    value={block.mediaUrl || ""}
                    onChange={event => setBlock(previous => ({
                        ...previous,
                        mediaUrl: event.target.value,
                        mediaType: "video"
                    }))}
                    placeholder="https://youtube.com/watch?v=... albo https://.../film.mp4"
                    className="w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-rose-300/50"
                />
            </label>
        </section>
    );
}

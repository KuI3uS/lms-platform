import { BsCodeSlash } from "react-icons/bs";

export default function ExampleBlockForm({ block, setBlock }) {
    function update(field, value) {
        setBlock(previous => ({ ...previous, [field]: value }));
    }

    return (
        <section className="space-y-5 rounded-3xl border border-teal-500/25 bg-teal-500/10 p-5 sm:p-6">
            <div className="flex items-center gap-3 text-teal-100">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-teal-400/15 text-xl">
                    <BsCodeSlash />
                </div>
                <div>
                    <h3 className="font-black">Przykład kodu</h3>
                    <p className="text-sm text-gray-400">Uczeń dostanie opis, kod i przycisk kopiowania.</p>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
                <label className="block space-y-2">
                    <span className="font-semibold">Tytuł przykładu</span>
                    <input
                        value={block.title || ""}
                        onChange={event => update("title", event.target.value)}
                        placeholder="Np. Pierwszy program w Javie"
                        className="w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-teal-300/50"
                    />
                </label>

                <label className="block space-y-2">
                    <span className="font-semibold">Język</span>
                    <select
                        value={block.language || "java"}
                        onChange={event => update("language", event.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-teal-300/50"
                    >
                        <option value="java">Java</option>
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="csharp">C#</option>
                        <option value="sql">SQL</option>
                        <option value="html">HTML</option>
                    </select>
                </label>
            </div>

            <label className="block space-y-2">
                <span className="font-semibold">Co pokazuje ten przykład?</span>
                <textarea
                    value={block.description || ""}
                    onChange={event => update("description", event.target.value)}
                    placeholder="Krótko wyjaśnij cel i najważniejsze linie kodu."
                    className="min-h-24 w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-teal-300/50"
                />
            </label>

            <label className="block space-y-2">
                <span className="font-semibold">Kod przykładu</span>
                <textarea
                    value={block.content || ""}
                    onChange={event => update("content", event.target.value)}
                    placeholder="Wklej kod..."
                    spellCheck="false"
                    className="min-h-80 w-full rounded-2xl border border-white/10 bg-[#07111f] p-5 font-mono leading-7 text-teal-100 outline-none focus:border-teal-300/50"
                />
            </label>
        </section>
    );
}

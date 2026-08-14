import { BsHeadphones, BsMic, BsTranslate } from "react-icons/bs";

const FIELD = "w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-violet-300/50";

export default function AudioBlockForm({ block, setBlock }) {
    const update = (field, value) => setBlock((previous) => ({
        ...previous,
        [field]: value,
        mediaType: "audio"
    }));

    return (
        <section className="space-y-5 rounded-3xl border border-violet-500/25 bg-violet-500/10 p-5 sm:p-6">
            <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-400/15 text-xl text-violet-200"><BsHeadphones /></div>
                <div><h3 className="font-black">Audio i ćwiczenie wymowy</h3><p className="text-sm text-gray-400">Uczeń odsłucha zwrot, nagra wypowiedź i otrzyma wynik.</p></div>
            </div>

            <label className="block space-y-2"><span className="font-semibold">Tytuł ćwiczenia</span><input value={block.title || ""} onChange={(event) => update("title", event.target.value)} placeholder="np. Przywitanie w kawiarni" className={FIELD} /></label>
            <label className="block space-y-2"><span className="font-semibold">Krótka instrukcja</span><textarea value={block.description || ""} onChange={(event) => update("description", event.target.value)} placeholder="Posłuchaj, a następnie powtórz całe zdanie." className={`${FIELD} min-h-24`} /></label>
            <label className="block space-y-2"><span className="flex items-center gap-2 font-semibold"><BsMic /> Zwrot do wypowiedzenia</span><textarea value={block.content || ""} onChange={(event) => update("content", event.target.value)} placeholder="Could I have a cup of coffee, please?" className={`${FIELD} min-h-24 text-lg font-bold`} /></label>
            <label className="block space-y-2"><span className="flex items-center gap-2 font-semibold"><BsHeadphones /> Adres pliku audio (opcjonalnie)</span><input value={block.mediaUrl || ""} onChange={(event) => update("mediaUrl", event.target.value)} placeholder="https://.../nagranie.mp3" className={FIELD} /><span className="text-xs text-slate-500">Bez pliku aplikacja użyje głosu dostępnego w urządzeniu ucznia.</span></label>
            <label className="block space-y-2"><span className="flex items-center gap-2 font-semibold"><BsTranslate /> Język rozpoznawania</span><select value={block.language || "en-US"} onChange={(event) => update("language", event.target.value)} className={FIELD}><option value="en-US">Angielski (USA)</option><option value="en-GB">Angielski (Wielka Brytania)</option><option value="de-DE">Niemiecki</option><option value="es-ES">Hiszpański</option><option value="fr-FR">Francuski</option><option value="it-IT">Włoski</option><option value="pl-PL">Polski</option></select></label>
        </section>
    );
}

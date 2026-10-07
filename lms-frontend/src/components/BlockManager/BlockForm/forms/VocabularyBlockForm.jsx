import { BsHeadphones, BsInputCursorText, BsTranslate } from "react-icons/bs";
import {
    parseVocabularyContent,
    parseVocabularyEditor,
    serializeVocabularyConfig,
    vocabularyToEditor
} from "../../../../utils/languageInteractiveBlocks";

const FIELD = "w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-emerald-300/50";
const MAX_WORDS = 20;

export default function VocabularyBlockForm({ block, setBlock, lab = false }) {
    const config = parseVocabularyContent(block.content);
    const count = config.items.length;

    const updateItems = (value) => setBlock((previous) => ({
        ...previous,
        content: serializeVocabularyConfig({
            ...config,
            items: parseVocabularyEditor(value)
        }),
        mediaType: "vocabulary"
    }));

    return (
        <section className="space-y-6 rounded-3xl border border-emerald-500/25 bg-emerald-500/[0.08] p-5 sm:p-6">
            <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-400/15 text-xl text-emerald-200"><BsTranslate /></div>
                <div>
                    <h3 className="font-black">{lab ? "Laboratorium słów" : "Trening słówek"}</h3>
                    <p className="text-sm text-gray-400">{lab ? "Uczeń przypomina znaczenie, wymawia każde słowo i musi poprawić błędy." : "Uczeń poznaje słowa, odsłuchuje je i wpisuje odpowiedzi samodzielnie."}</p>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <label className="block space-y-2">
                    <span className="font-semibold">Tytuł treningu</span>
                    <input value={block.title || ""} onChange={(event) => setBlock((previous) => ({ ...previous, title: event.target.value }))} placeholder="np. Powitania i pożegnania" className={FIELD} />
                </label>
                <label className="block space-y-2">
                    <span className="flex items-center gap-2 font-semibold"><BsHeadphones /> Język słówek</span>
                    <select value={/^[a-z]{2}-[A-Z]{2}$/.test(block.language || "") ? block.language : "en-GB"} onChange={(event) => setBlock((previous) => ({ ...previous, language: event.target.value, mediaType: "vocabulary" }))} className={FIELD}>
                        <option value="en-GB">Angielski (Wielka Brytania)</option>
                        <option value="en-US">Angielski (USA)</option>
                        <option value="de-DE">Niemiecki</option>
                        <option value="es-ES">Hiszpański</option>
                        <option value="fr-FR">Francuski</option>
                        <option value="it-IT">Włoski</option>
                        <option value="pl-PL">Polski</option>
                    </select>
                </label>
            </div>

            <label className="block space-y-2">
                <span className="font-semibold">Instrukcja dla ucznia</span>
                <textarea value={block.description || ""} onChange={(event) => setBlock((previous) => ({ ...previous, description: event.target.value }))} placeholder="Najpierw poznaj słowa, a później wpisz ich znaczenia bez podglądania." className={`${FIELD} min-h-24`} />
            </label>

            <label className="block space-y-2">
                <span className="flex items-center gap-2 font-semibold"><BsInputCursorText /> Słówka — od 1 do {MAX_WORDS}, każde w nowym wierszu</span>
                <textarea
                    value={vocabularyToEditor(config)}
                    onChange={(event) => updateItems(event.target.value)}
                    placeholder={'hello | cześć | Hello, Anna! | hej; dzień dobry\ngood morning | dzień dobry | Good morning, Emma!\nbye | cześć, do widzenia | Bye, Leo! | goodbye'}
                    className={`${FIELD} min-h-72 font-mono text-sm leading-7`}
                />
                <span className="block text-xs leading-5 text-slate-500">
                    Format: <strong className="text-slate-300">słowo | tłumaczenie | przykład (opcjonalnie) | inne uznawane odpowiedzi oddzielone średnikami (opcjonalnie)</strong>
                </span>
            </label>

            <div className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm ${count > MAX_WORDS ? "border-red-400/30 bg-red-500/10 text-red-100" : "border-emerald-300/15 bg-emerald-300/[0.06] text-emerald-100"}`}>
                <span className="font-bold">Liczba słówek: {count}/{MAX_WORDS}</span>
                <span>{count > MAX_WORDS ? `Usuń ${count - MAX_WORDS} nadmiarowe pozycje.` : "Sam decydujesz, ile słówek ma ten blok."}</span>
            </div>
        </section>
    );
}

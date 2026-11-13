import { useLocale } from "../../../../context/LocaleContext.jsx";
import { BsHeadphones } from "react-icons/bs";
import { parseVocabularyContent, parseVocabularyEditor, serializeVocabularyConfig, vocabularyToEditor } from "../../../../utils/languageInteractiveBlocks";

const FIELD = "w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-cyan-300/50";

export default function ListeningBlockForm({ block, setBlock }) {
    const { t } = useLocale();
    const config = parseVocabularyContent(block.content);
    const updateItems = (value) => setBlock((previous) => ({ ...previous, content: serializeVocabularyConfig({ ...config, items: parseVocabularyEditor(value) }), mediaType: "listening" }));
    return <section className="space-y-5 rounded-3xl border border-cyan-500/25 bg-cyan-500/[0.08] p-5 sm:p-6">
        <div><h3 className="flex items-center gap-2 font-black"><BsHeadphones />{t(" Rozpoznawanie ze słuchu")}</h3><p className="mt-1 text-sm text-slate-400">{t("Odpowiedź pozostaje ukryta. Uczeń słucha i wpisuje literę, słowo albo zdanie.")}</p></div>
        <label className="block space-y-2"><span className="font-semibold">{t("Tytuł")}</span><input className={FIELD} value={block.title || ""} onChange={(event) => setBlock((previous) => ({ ...previous, title: event.target.value }))} /></label>
        <label className="block space-y-2"><span className="font-semibold">{t("Instrukcja")}</span><textarea className={FIELD} value={block.description || ""} onChange={(event) => setBlock((previous) => ({ ...previous, description: event.target.value }))} placeholder={t("Posłuchaj i wpisz to, co słyszysz.")} /></label>
        <label className="block space-y-2"><span className="font-semibold">{t("Nagrania — jedno w wierszu")}</span><textarea className={`${FIELD} min-h-64 font-mono`} value={vocabularyToEditor(config)} onChange={(event) => updateItems(event.target.value)} placeholder={t("N | N\nM | M\nshop | shop")} /><span className="text-xs text-slate-500">{t("Format: tekst czytany przez lektora | poprawna odpowiedź | opcjonalny kontekst | inne uznawane odpowiedzi")}</span></label>
        <label className="block space-y-2"><span className="font-semibold">{t("Język audio")}</span><select className={FIELD} value={block.language || "en-GB"} onChange={(event) => setBlock((previous) => ({ ...previous, language: event.target.value, mediaType: "listening" }))}><option value="en-GB">{t("Angielski (Wielka Brytania)")}</option><option value="en-US">{t("Angielski (USA)")}</option><option value="de-DE">{t("Niemiecki")}</option><option value="es-ES">{t("Hiszpański")}</option><option value="fr-FR">{t("Francuski")}</option></select></label>
    </section>;
}

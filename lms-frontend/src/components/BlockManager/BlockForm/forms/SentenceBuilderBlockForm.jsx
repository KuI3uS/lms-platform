import { useLocale } from "../../../../context/LocaleContext.jsx";
import { BsGrid3X3Gap, BsTranslate } from "react-icons/bs";
import {
    parseSentenceBuilderContent,
    serializeSentenceBuilderConfig
} from "../../../../utils/sentenceBuilder";

const FIELD = "w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-amber-300/50";

export default function SentenceBuilderBlockForm({ block, setBlock }) {
    const { t } = useLocale();
    const config = parseSentenceBuilderContent(block.content);
    const englishSentence = config.words.join(" ");

    const update = (changes) => {
        setBlock((previous) => ({
            ...previous,
            content: serializeSentenceBuilderConfig({ ...config, ...changes }),
            mediaType: "sentence-builder",
            language: previous.language || "en-GB"
        }));
    };

    return (
        <section className="space-y-5 rounded-3xl border border-amber-400/25 bg-amber-500/[0.07] p-5 sm:p-6">
            <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-amber-300/15 text-xl text-amber-200"><BsGrid3X3Gap /></div>
                <div>
                    <h3 className="font-black">{t("Układanie zdania")}</h3>
                    <p className="text-sm text-slate-400">{t("Uczeń układa angielskie zdanie z 2–6 pomieszanych kafelków.")}</p>
                </div>
            </div>

            <label className="block space-y-2">
                <span className="font-semibold">{t("Tytuł ćwiczenia")}</span>
                <input className={FIELD} value={block.title || ""} onChange={(event) => setBlock((previous) => ({ ...previous, title: event.target.value }))} placeholder={t("np. Ułóż poranne powitanie")} />
            </label>

            <label className="block space-y-2">
                <span className="flex items-center gap-2 font-semibold"><BsTranslate />{t("Zdanie do przetłumaczenia")}</span>
                <input className={FIELD} value={config.polishSentence} onChange={(event) => update({ polishSentence: event.target.value })} placeholder={t("np. Mam się dobrze, dziękuję.")} />
            </label>

            <label className="block space-y-2">
                <span className="font-semibold">{t("Poprawne zdanie po angielsku")}</span>
                <input className={FIELD} value={englishSentence} onChange={(event) => update({ words: event.target.value.split(/\s+/).filter(Boolean).slice(0, 6) })} placeholder={t("np. I'm good thank you")} />
                <span className="block text-xs text-slate-500">{t("Każdy wyraz stanie się osobnym kafelkiem. Wymagane są 2–6 kafelków. Obecnie: ")}{config.words.length}.</span>
            </label>
        </section>
    );
}

import { useLocale } from "../../../../context/LocaleContext.jsx";
import { BsHeadphones, BsMic, BsTranslate } from "react-icons/bs";

const SPELLING_EXERCISES = [
    { title: "Poproś o przeliterowanie nazwiska", content: "Could you spell your last name for me, please?", description: "Poproś uprzejmie rozmówcę o przeliterowanie nazwiska. Posłuchaj i powtórz całe zdanie." },
    { title: "Upewnij się: B czy P?", content: "Did you say B as in Bravo or P as in Peter?", description: "Upewnij się, którą literę usłyszałeś. Powtórz całe pytanie, wyraźnie rozróżniając B i P." },
    { title: "Poproś o wolniejsze literowanie", content: "Would you mind spelling that a little more slowly?", description: "Poproś uprzejmie o wolniejsze literowanie. Zwróć uwagę na płynność całego pytania." },
    { title: "Potwierdź adres e-mail", content: "Let me read your email address back to make sure I have it right.", description: "Zapowiedz ponowne odczytanie adresu e-mail, żeby sprawdzić jego poprawność. Powtórz całe zdanie." }
];

const FIELD = "w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-violet-300/50";

export default function AudioBlockForm({ block, setBlock }) {
    const { t } = useLocale();
    const update = (field, value) => setBlock((previous) => ({
        ...previous,
        [field]: value,
        mediaType: "audio"
    }));

    return (
        <section className="space-y-5 rounded-3xl border border-violet-500/25 bg-violet-500/10 p-5 sm:p-6">
            <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-400/15 text-xl text-violet-200"><BsHeadphones /></div>
                <div><h3 className="font-black">{t("Audio i ćwiczenie wymowy")}</h3><p className="text-sm text-gray-400">{t("Uczeń odsłucha zwrot, nagra wypowiedź i otrzyma wynik.")}</p></div>
            </div>

            <label className="block space-y-2">
                <span className="font-semibold">{t("Gotowe zwroty: alfabet w rozmowie")}</span>
                <select value="" onChange={(event) => {
                    const exercise = SPELLING_EXERCISES[Number(event.target.value)];
                    if (event.target.value === "" || !exercise) return;
                    setBlock((previous) => ({ ...previous, ...exercise, mediaType: "audio", mediaUrl: "", language: "en-GB" }));
                }} className={FIELD}>
                    <option value="">{t("Wybierz zwrot do ćwiczenia…")}</option>
                    {SPELLING_EXERCISES.map((exercise, index) => <option key={exercise.title} value={index}>{exercise.title}</option>)}
                </select>
                <span className="block text-xs text-slate-400">{t("Wybór zastąpi tytuł, instrukcję i zwrot oraz usunie poprzedni adres audio. Zmiany zatwierdzisz przyciskiem „Zapisz zmiany”.")}</span>
            </label>

            <label className="block space-y-2"><span className="font-semibold">{t("Tytuł ćwiczenia")}</span><input value={block.title || ""} onChange={(event) => update("title", event.target.value)} placeholder={t("np. Przywitanie w kawiarni")} className={FIELD} /></label>
            <label className="block space-y-2"><span className="font-semibold">{t("Krótka instrukcja")}</span><textarea value={block.description || ""} onChange={(event) => update("description", event.target.value)} placeholder={t("Posłuchaj, a następnie powtórz całe zdanie.")} className={`${FIELD} min-h-24`} /></label>
            <label className="block space-y-2"><span className="flex items-center gap-2 font-semibold"><BsMic />{t(" Zwrot do wypowiedzenia")}</span><textarea value={block.content || ""} onChange={(event) => update("content", event.target.value)} placeholder={t("Could I have a cup of coffee, please?")} className={`${FIELD} min-h-24 text-lg font-bold`} /></label>
            <label className="block space-y-2"><span className="flex items-center gap-2 font-semibold"><BsHeadphones />{t(" Adres pliku audio (opcjonalnie)")}</span><input value={block.mediaUrl || ""} onChange={(event) => update("mediaUrl", event.target.value)} placeholder={t("https://.../nagranie.mp3")} className={FIELD} /><span className="text-xs text-slate-500">{t("Bez pliku aplikacja użyje głosu dostępnego w urządzeniu ucznia.")}</span></label>
            <label className="block space-y-2"><span className="flex items-center gap-2 font-semibold"><BsTranslate />{t(" Język rozpoznawania")}</span><select value={block.language || "en-US"} onChange={(event) => update("language", event.target.value)} className={FIELD}><option value="en-US">{t("Angielski (USA)")}</option><option value="en-GB">{t("Angielski (Wielka Brytania)")}</option><option value="de-DE">{t("Niemiecki")}</option><option value="es-ES">{t("Hiszpański")}</option><option value="fr-FR">{t("Francuski")}</option><option value="it-IT">{t("Włoski")}</option><option value="pl-PL">{t("Polski")}</option></select></label>
        </section>
    );
}

import { useLocale } from "../../../../context/LocaleContext.jsx";
import {
    useState
} from "react";

import {
    BsChatDots,
    BsHeadphones,
    BsPeople,
    BsPersonCheck
} from "react-icons/bs";

import {
    dialogueToEditor,
    parseDialogContent,
    parseDialogueEditor,
    serializeDialogConfig
} from "../../../../utils/languageInteractiveBlocks";
import { characterVoiceGender } from "../../../../utils/dialogSpeech";

const FIELD =
    "w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-cyan-300/50";

export default function DialogBlockForm({
                                            block,
                                            setBlock
                                        }) {
    const { t } = useLocale();
    const config = parseDialogContent(
        block.content
    );

    const characters = Array.isArray(config.characters)
        ? config.characters
        : [];

    /*
     * WAŻNE:
     *
     * Nie możemy generować tekstu textarea z config
     * przy każdym naciśnięciu klawisza.
     *
     * Inaczej Enter tworzy pustą linię,
     * parser ją usuwa i textarea natychmiast
     * wraca do poprzedniej wartości.
     */
    const [dialogueDraft, setDialogueDraft] =
        useState(() => dialogueToEditor(config));
    const [draftSource, setDraftSource] = useState(block.content);


    /*
     * Jeśli wczytamy inny dialog / edytujemy istniejący blok,
     * aktualizujemy zawartość edytora.
     *
     * Podczas normalnego pisania block.content się nie zmienia,
     * dopóki użytkownik nie opuści textarea.
     */
    if (draftSource !== block.content) {
        const parsed =
            parseDialogContent(block.content);

        setDialogueDraft(
            dialogueToEditor(parsed)
        );
        setDraftSource(block.content);
    }


    const saveConfig = (
        nextConfig,
        extra = {}
    ) => {
        setBlock(previous => ({
            ...previous,
            ...extra,

            content:
                serializeDialogConfig(nextConfig),

            mediaType: "dialog",

            language:
                extra.language
                ?? (
                    /^[a-z]{2}-[A-Z]{2}$/.test(
                        previous.language || ""
                    )
                        ? previous.language
                        : "en-GB"
                )
        }));
    };


    const updateCharacter = (
        index,
        field,
        value
    ) => {
        const nextCharacters =
            characters.map(
                (
                    character,
                    characterIndex
                ) => (
                    characterIndex === index
                        ? {
                            ...character,
                            [field]: value
                        }
                        : character
                )
            );

        saveConfig({
            ...config,
            characters: nextCharacters
        });
    };


    /*
     * Tutaj TYLKO zapisujemy tekst lokalnie.
     *
     * Dzięki temu Enter pozostaje w textarea.
     */
    const updateDialogueDraft = value => {
        setDialogueDraft(value);
    };


    /*
     * Dopiero po opuszczeniu textarea
     * parsujemy cały dialog.
     */
    const saveDialogue = () => {
        const turns =
            parseDialogueEditor(
                dialogueDraft,
                characters
            );

        saveConfig({
            ...config,
            turns
        });
    };


    const changeStudentRole =
        studentCharacterId => {

            saveConfig({
                ...config,

                studentCharacterId,

                turns:
                    (config.turns || [])
                        .map(turn => ({
                            ...turn,
                            studentTurn: false
                        }))
            });
        };


    const firstCharacter =
        characters[0] || {
            id: "character-1",
            name: "Emma",
            avatar: "👩"
        };


    const secondCharacter =
        characters[1] || {
            id: "character-2",
            name: "Leo",
            avatar: "👨"
        };


    return (
        <section className="space-y-6 rounded-3xl border border-cyan-500/25 bg-cyan-500/[0.08] p-5 sm:p-6">

            <div className="flex items-center gap-3">

                <div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-400/15 text-xl text-cyan-200">
                    <BsChatDots />
                </div>

                <div>
                    <h3 className="font-black">{t("Dialog interaktywny")}</h3>

                    <p className="text-sm text-gray-400">{t("Cała scenka — nawet 60 wypowiedzi — zajmuje tylko jeden blok lekcji.")}</p>
                </div>

            </div>


            <div className="grid gap-4 lg:grid-cols-2">

                <label className="block space-y-2">

                    <span className="font-semibold">{t("Tytuł dialogu")}</span>

                    <input
                        value={block.title || ""}
                        onChange={event =>
                            setBlock(previous => ({
                                ...previous,
                                title: event.target.value
                            }))
                        }
                        placeholder={t("np. Pierwsze spotkanie")}
                        className={FIELD}
                    />

                </label>


                <label className="block space-y-2">

                    <span className="flex items-center gap-2 font-semibold">
                        <BsHeadphones />{t("Język rozmowy")}</span>

                    <select
                        value={
                            /^[a-z]{2}-[A-Z]{2}$/.test(
                                block.language || ""
                            )
                                ? block.language
                                : "en-GB"
                        }
                        onChange={event =>
                            setBlock(previous => ({
                                ...previous,
                                language: event.target.value,
                                mediaType: "dialog"
                            }))
                        }
                        className={FIELD}
                    >

                        <option value="en-GB">{t("Angielski (Wielka Brytania)")}</option>

                        <option value="en-US">{t("Angielski (USA)")}</option>

                        <option value="de-DE">{t("Niemiecki")}</option>

                        <option value="es-ES">{t("Hiszpański")}</option>

                        <option value="fr-FR">{t("Francuski")}</option>

                        <option value="it-IT">{t("Włoski")}</option>

                        <option value="pl-PL">{t("Polski")}</option>

                    </select>

                </label>

            </div>


            <label className="block space-y-2">

                <span className="font-semibold">{t("Opis sytuacji")}</span>

                <textarea
                    value={block.description || ""}
                    onChange={event =>
                        setBlock(previous => ({
                            ...previous,
                            description:
                            event.target.value
                        }))
                    }
                    placeholder={t("Emma rano wchodzi do kawiarni i spotyka Leo.")}
                    className={`${FIELD} min-h-24`}
                />

            </label>


            <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">

                <p className="mb-4 flex items-center gap-2 font-black text-white">
                    <BsPeople />{t("Bohaterowie scenki")}</p>


                <div className="grid gap-4 lg:grid-cols-2">

                    {characters.map(
                        (
                            character,
                            index
                        ) => (

                            <div
                                key={character.id}
                                className="grid grid-cols-[88px_1fr] gap-3"
                            >

                                <label className="space-y-2">

                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t("Avatar")}</span>

                                    <input
                                        value={
                                            character.avatar || ""
                                        }
                                        onChange={event =>
                                            updateCharacter(
                                                index,
                                                "avatar",
                                                event.target.value
                                            )
                                        }
                                        maxLength={8}
                                        className={`${FIELD} text-center text-xl`}
                                    />

                                </label>


                                <label className="space-y-2">

                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t("Postać ")}{index + 1}
                                    </span>

                                    <input
                                        value={
                                            character.name || ""
                                        }
                                        onChange={event =>
                                            updateCharacter(
                                                index,
                                                "name",
                                                event.target.value
                                            )
                                        }
                                        placeholder={
                                            index === 0
                                                ? t("Emma")
                                                : t("Leo")
                                        }
                                        className={FIELD}
                                    />

                                </label>

                                <label className="col-span-2 space-y-2">
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t("Głos")}</span>
                                    <select value={characterVoiceGender(character)} onChange={event => updateCharacter(index, "voiceGender", event.target.value)} className={FIELD}>
                                        <option value="female">{t("Kobieta")}</option>
                                        <option value="male">{t("Mężczyzna")}</option>
                                    </select>
                                </label>
                            </div>
                        )
                    )}

                </div>

            </div>


            <label className="block space-y-2">

                <span className="flex items-center gap-2 font-semibold">
                    <BsPersonCheck />{t("W którą postać wciela się uczeń?")}</span>

                <select
                    value={
                        config.studentCharacterId
                        || firstCharacter.id
                        || ""
                    }
                    onChange={event =>
                        changeStudentRole(
                            event.target.value
                        )
                    }
                    className={FIELD}
                >

                    {characters.map(character => (

                        <option
                            key={character.id}
                            value={character.id}
                        >
                            {character.avatar}{" "}
                            {character.name}
                        </option>

                    ))}

                </select>

            </label>


            <label className="block space-y-2">

                <span className="font-semibold">{t("Dialog — jedna wypowiedź w każdym wierszu")}</span>


                <textarea

                    /*
                     * KLUCZOWA ZMIANA:
                     *
                     * Nie:
                     *
                     * value={dialogueToEditor(config)}
                     *
                     * tylko lokalny draft.
                     */
                    value={dialogueDraft}

                    onChange={event =>
                        updateDialogueDraft(
                            event.target.value
                        )
                    }

                    /*
                     * Dopiero tutaj zapisujemy
                     * tekst do struktury dialogu.
                     */
                    onBlur={saveDialogue}

                    placeholder={
                        `${firstCharacter.name}: Good morning!\n`
                        + `${secondCharacter.name}: Good morning! || Morning! || To poranne powitanie. || Dzień dobry!\n`
                        + `${firstCharacter.name}: How are you?\n`
                        + `${secondCharacter.name}: I'm good, thanks. || Fine, thanks. || Krótko odpowiedz na pytanie. || Mam się dobrze, dziękuję.`
                    }

                    className={`${FIELD} min-h-72 font-mono text-sm leading-7`}
                />


                <span className="block text-xs leading-5 text-slate-500">{t("Każda wypowiedź musi znajdować się w osobnym wierszu. Format:")}{" "}

                    <strong className="text-slate-300">{t("Postać: wypowiedź")}</strong>

                    <br />{t("Przykład:")}<br />

                    <strong className="text-slate-300">{t("Emma: Good morning!")}</strong>

                    <br />

                    <strong className="text-slate-300">{t("Leo: Good morning!")}</strong>

                    <br />{t("Opcjonalnie po")}{" "}

                    <strong className="text-slate-300">
                        ||
                    </strong>{" "}{t("możesz podać kolejno: inne poprawne odpowiedzi, wyjaśnienie i polskie zdanie do przetłumaczenia.")}</span>

            </label>


            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.06] px-4 py-3 text-sm">

                <span className="font-bold text-cyan-100">{t("Wypowiedzi w tym bloku:")}{" "}
                    {
                        Array.isArray(config.turns)
                            ? config.turns.length
                            : 0
                    }
                </span>

                <span className="text-cyan-200/70">{t("Wszystkie kwestie wybranej postaci będą ćwiczone głosem lub tekstem.")}</span>

            </div>

        </section>
    );
}

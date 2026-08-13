import {
    BsBook,
    BsCardText,
    BsCheckCircle,
    BsLightbulb,
    BsTranslate
} from "react-icons/bs";

const FIELD = "w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400";

export default function LanguageTaskBlockForm({ block, setBlock }) {
    const update = (field, value) => setBlock((previous) => ({
        ...previous,
        [field]: value,
        language: "",
        starterCode: ""
    }));

    return (
        <section className="space-y-6 rounded-3xl border border-violet-400/15 bg-violet-500/[0.05] p-5 sm:p-6">
            <div>
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-violet-300">
                    <BsTranslate /> Ćwiczenie językowe
                </p>
                <h2 className="mt-2 text-2xl font-black">Krótka odpowiedź ucznia</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                    Bez kodu i konfiguracji technicznej. System zaakceptuje wielkie lub małe litery oraz opcjonalną interpunkcję.
                </p>
            </div>

            <Field icon={<BsBook />} label="Tytuł">
                <input
                    value={block.title || ""}
                    onChange={(event) => update("title", event.target.value)}
                    placeholder="np. Jak się przedstawisz?"
                    className={FIELD}
                />
            </Field>

            <Field icon={<BsCardText />} label="Polecenie">
                <textarea
                    value={block.instruction || ""}
                    onChange={(event) => update("instruction", event.target.value)}
                    placeholder="Przetłumacz na angielski: Mam na imię Anna."
                    className={`${FIELD} min-h-32 resize-y`}
                />
            </Field>

            <Field icon={<BsCheckCircle />} label="Akceptowane odpowiedzi">
                <input
                    value={block.expectedAnswer || ""}
                    onChange={(event) => update("expectedAnswer", event.target.value)}
                    placeholder="My name is Anna | I'm Anna"
                    className={FIELD}
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                    Kilka poprawnych wersji oddziel pionową kreską <strong className="text-slate-300">|</strong>.
                </p>
            </Field>

            <div className="grid gap-5 lg:grid-cols-2">
                <Field icon={<BsLightbulb />} label="Pierwsza wskazówka">
                    <textarea
                        value={block.hint || ""}
                        onChange={(event) => update("hint", event.target.value)}
                        placeholder="Przypomnij uczniowi pierwszy potrzebny zwrot."
                        className={`${FIELD} min-h-28 resize-y`}
                    />
                </Field>
                <Field icon={<BsLightbulb />} label="Wyjaśnienie po kolejnych próbach">
                    <textarea
                        value={block.detailedHint || ""}
                        onChange={(event) => update("detailedHint", event.target.value)}
                        placeholder="Wyjaśnij konstrukcję zdania bez oceniania ucznia."
                        className={`${FIELD} min-h-28 resize-y`}
                    />
                </Field>
            </div>
        </section>
    );
}

function Field({ icon, label, children }) {
    return (
        <label className="block">
            <span className="mb-2 flex items-center gap-2 text-sm font-black text-violet-200">{icon} {label}</span>
            {children}
        </label>
    );
}

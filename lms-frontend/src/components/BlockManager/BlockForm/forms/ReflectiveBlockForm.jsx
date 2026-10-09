import { BsCardText, BsCheckCircle, BsCodeSlash, BsGlobe, BsLightbulb } from "react-icons/bs";
import { CODE_LANGUAGE_OPTIONS } from "../../../../utils/codeLanguages";

export default function ReflectiveBlockForm({ block, setBlock, mode }) {
    const isCodeReview = mode === "CODE_REVIEW";

    function update(field, value) {
        setBlock(previous => ({ ...previous, [field]: value }));
    }

    return (
        <section className="space-y-6 rounded-3xl border border-violet-500/25 bg-violet-500/[0.08] p-5 sm:p-6">
            <div>
                <h2 className="text-2xl font-black text-violet-100">
                    {block.id ? "Edytuj" : "Nowy blok:"} {isCodeReview ? "analiza kodu / code review" : "odpowiedź otwarta"}
                </h2>
                <p className="mt-1 text-gray-400">
                    Uczeń najpierw formułuje własną odpowiedź, a potem porównuje ją z modelem i kryteriami samooceny.
                </p>
            </div>

            <label className="block space-y-2">
                <span className="font-bold">Tytuł</span>
                <input
                    value={block.title || ""}
                    onChange={event => update("title", event.target.value)}
                    placeholder={isCodeReview ? "Np. Znajdź naruszenia zasad Clean Code" : "Np. Wyjaśnij odpowiedzialność warstwy serwisowej"}
                    className="w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-violet-300/50"
                />
            </label>

            <label className="block space-y-2">
                <span className="flex items-center gap-2 font-bold"><BsCardText /> Kontekst</span>
                <textarea
                    value={block.description || ""}
                    onChange={event => update("description", event.target.value)}
                    placeholder="Sytuacja, ograniczenia i potrzebny kontekst."
                    className="min-h-24 w-full rounded-xl border border-white/10 bg-gray-950/70 p-4 outline-none focus:border-violet-300/50"
                />
            </label>

            <label className="block space-y-2">
                <span className="font-bold">Pytanie i kryteria odpowiedzi</span>
                <textarea
                    value={block.instruction || ""}
                    onChange={event => update("instruction", event.target.value)}
                    placeholder="Napisz, co uczeń ma przeanalizować i do jakich punktów powinien się odnieść."
                    className="min-h-36 w-full rounded-xl border border-white/10 bg-gray-950/70 p-4 outline-none focus:border-violet-300/50"
                />
            </label>

            {isCodeReview && (
                <>
                    <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
                        <label className="block space-y-2">
                            <span className="flex items-center gap-2 font-bold"><BsCodeSlash /> Kod do analizy</span>
                            <textarea
                                value={block.starterCode || ""}
                                onChange={event => update("starterCode", event.target.value)}
                                spellCheck="false"
                                className="min-h-72 w-full rounded-2xl border border-white/10 bg-[#07111f] p-5 font-mono leading-7 text-violet-100 outline-none focus:border-violet-300/50"
                            />
                        </label>
                        <label className="block space-y-2">
                            <span className="flex items-center gap-2 font-bold"><BsGlobe /> Język</span>
                            <select
                                value={block.language || "java"}
                                onChange={event => update("language", event.target.value)}
                                className="w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-violet-300/50"
                            >
                                {CODE_LANGUAGE_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                </>
            )}

            <label className="block space-y-2">
                <span className="flex items-center gap-2 font-bold"><BsCheckCircle /> Model odpowiedzi i kryteria samooceny</span>
                <textarea
                    value={block.expectedAnswer || ""}
                    onChange={event => update("expectedAnswer", event.target.value)}
                    placeholder={"Model odpowiedzi:\n...\n\nSprawdź, czy Twoja odpowiedź zawiera:\n- ...\n- ..."}
                    className="min-h-52 w-full rounded-xl border border-white/10 bg-gray-950/70 p-4 outline-none focus:border-violet-300/50"
                />
                <p className="text-xs leading-5 text-gray-500">Uczeń zobaczy ten materiał dopiero po wysłaniu własnej odpowiedzi.</p>
            </label>

            <label className="block space-y-2">
                <span className="flex items-center gap-2 font-bold"><BsLightbulb /> Podpowiedź przed wysłaniem</span>
                <textarea
                    value={block.hint || ""}
                    onChange={event => update("hint", event.target.value)}
                    placeholder="Naprowadź na obszary analizy bez podawania modelu odpowiedzi."
                    className="min-h-24 w-full rounded-xl border border-white/10 bg-gray-950/70 p-4 outline-none focus:border-violet-300/50"
                />
            </label>
        </section>
    );
}

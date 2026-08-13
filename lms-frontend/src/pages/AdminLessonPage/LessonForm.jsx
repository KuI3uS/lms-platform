import {
    BsBook,
    BsCardText,
    BsChatDots,
    BsCodeSlash,
    BsEye,
    BsImage,
    BsSave,
    BsStars,
    BsTranslate
} from "react-icons/bs";

export default function LessonForm({
    form,
    setForm,
    editingId,
    onCreate,
    onUpdate,
    variant = "PROGRAMMING"
}) {
    const language = variant === "LANGUAGE";
    const accent = language ? "text-violet-300" : "text-cyan-300";
    const focus = language ? "focus:border-violet-400" : "focus:border-cyan-400";
    const fieldClass = "w-full rounded-2xl border border-white/10 bg-black/25 px-5 py-4 text-white outline-none transition placeholder:text-slate-600";
    const update = (field, value) => setForm({ ...form, [field]: value });

    return (
        <section className={`relative overflow-hidden rounded-[38px] border p-6 sm:p-9 ${
            language
                ? "border-violet-400/20 bg-gradient-to-br from-[#120d25] via-[#0c1020] to-violet-950/60"
                : "border-cyan-400/20 bg-gradient-to-br from-slate-950 via-[#081325] to-cyan-950"
        }`}>
            <div className={`absolute -right-24 -top-24 h-80 w-80 rounded-full blur-3xl ${language ? "bg-violet-500/10" : "bg-cyan-500/10"}`} />

            <div className="relative space-y-7">
                <header>
                    <div className={`inline-flex items-center gap-2 rounded-full border border-current/20 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${accent}`}>
                        {language ? <BsTranslate /> : <BsStars />}
                        {language ? "Prosty kreator językowy" : "EduHub Creator"}
                    </div>
                    <h1 className="mt-5 text-4xl font-black sm:text-5xl">
                        {editingId ? "Edytuj lekcję" : "Nowa lekcja"}
                    </h1>
                    <p className="mt-3 max-w-3xl leading-7 text-slate-400">
                        {language
                            ? "Ustal jeden cel, dodaj kilka zwrotów, a następnie zbuduj krótkie ćwiczenia. Bez pól programistycznych i zbędnej konfiguracji."
                            : "Zdefiniuj cel lekcji i jej podstawowe materiały. Rozbudowane przykłady, zadania i quizy dodasz później jako bloki."}
                    </p>
                </header>

                <div className="grid gap-5 xl:grid-cols-2">
                    <Panel icon={<BsBook />} title="Tytuł lekcji" accent={accent}>
                        <input
                            value={form.title || ""}
                            onChange={(event) => update("title", event.target.value)}
                            placeholder={language ? "np. Przedstawianie się" : "np. Zmienne i typy danych"}
                            className={`${fieldClass} ${focus}`}
                        />
                    </Panel>

                    <Panel icon={<BsCardText />} title={language ? "Cel komunikacyjny" : "Cel lekcji"} accent={accent}>
                        <textarea
                            value={form.theory || ""}
                            onChange={(event) => update("theory", event.target.value)}
                            placeholder={language
                                ? "Po tej lekcji uczeń potrafi się przedstawić i zapytać rozmówcę o imię."
                                : "Wyjaśnij, czego uczeń nauczy się i co będzie potrafił zrobić."}
                            className={`${fieldClass} min-h-36 resize-y ${focus}`}
                        />
                    </Panel>
                </div>

                {language ? (
                    <Panel icon={<BsChatDots />} title="Najważniejsze słowa i zdania" accent={accent}>
                        <textarea
                            value={form.content || ""}
                            onChange={(event) => update("content", event.target.value)}
                            placeholder={"Hello — Cześć\nMy name is… — Mam na imię…\nWhat is your name? — Jak masz na imię?"}
                            className={`${fieldClass} min-h-48 resize-y ${focus}`}
                        />
                        <p className="mt-3 text-xs leading-5 text-slate-500">
                            Wystarczy 5–8 nowych elementów. Kolejne przykłady i ćwiczenia dodasz w prostym edytorze pod kartą lekcji.
                        </p>
                    </Panel>
                ) : (
                    <div className="grid gap-5 xl:grid-cols-2">
                        <Panel icon={<BsCodeSlash />} title="Krótki przykład startowy" accent={accent}>
                            <textarea
                                value={form.example || ""}
                                onChange={(event) => update("example", event.target.value)}
                                placeholder={"public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello World\");\n    }\n}"}
                                className={`${fieldClass} min-h-56 resize-y font-mono text-sm ${focus}`}
                            />
                        </Panel>
                        <Panel icon={<BsCardText />} title="Dodatkowe informacje" accent={accent}>
                            <textarea
                                value={form.content || ""}
                                onChange={(event) => update("content", event.target.value)}
                                placeholder="Wymagania, potrzebne narzędzia albo krótka wskazówka organizacyjna."
                                className={`${fieldClass} min-h-56 resize-y ${focus}`}
                            />
                        </Panel>
                    </div>
                )}

                <Panel icon={<BsImage />} title="Grafika wprowadzająca (opcjonalnie)" accent={accent}>
                    <input
                        value={form.imageUrl || ""}
                        onChange={(event) => update("imageUrl", event.target.value)}
                        placeholder="https://..."
                        className={`${fieldClass} ${focus}`}
                    />
                    {form.imageUrl && (
                        <img
                            src={form.imageUrl}
                            alt="Podgląd grafiki lekcji"
                            className="mt-4 max-h-72 w-full rounded-2xl border border-white/10 object-cover"
                        />
                    )}
                </Panel>

                <div className="grid gap-4 md:grid-cols-2">
                    <Toggle
                        icon={<BsEye />}
                        title="Opublikowana"
                        description="Lekcja jest widoczna dla uczniów."
                        checked={form.published ?? true}
                        onChange={(checked) => update("published", checked)}
                    />
                    <Toggle
                        icon={<BsStars />}
                        title="Bezpłatny podgląd"
                        description="Lekcję można otworzyć przed zakupem kursu."
                        checked={form.freePreview ?? false}
                        onChange={(checked) => update("freePreview", checked)}
                    />
                </div>

                <button
                    type="button"
                    onClick={editingId ? onUpdate : onCreate}
                    className={`flex w-full items-center justify-center gap-3 rounded-2xl py-4 font-black text-white transition hover:-translate-y-0.5 ${
                        language
                            ? "bg-gradient-to-r from-violet-600 to-fuchsia-600"
                            : "bg-gradient-to-r from-cyan-500 to-blue-600"
                    }`}
                >
                    <BsSave /> {editingId ? "Zapisz zmiany" : "Dodaj lekcję"}
                </button>
            </div>
        </section>
    );
}

function Panel({ icon, title, accent, children }) {
    return (
        <div className="rounded-3xl border border-white/[0.08] bg-black/20 p-5 sm:p-6">
            <label className={`mb-4 flex items-center gap-3 font-black ${accent}`}>
                {icon} {title}
            </label>
            {children}
        </div>
    );
}

function Toggle({ icon, title, description, checked, onChange }) {
    return (
        <label className="flex cursor-pointer items-center gap-4 rounded-3xl border border-white/[0.08] bg-black/20 p-5">
            <input
                type="checkbox"
                checked={checked}
                onChange={(event) => onChange(event.target.checked)}
                className="h-5 w-5 accent-violet-500"
            />
            <span className="text-xl text-slate-400">{icon}</span>
            <span>
                <span className="block font-black">{title}</span>
                <span className="mt-1 block text-xs text-slate-500">{description}</span>
            </span>
        </label>
    );
}

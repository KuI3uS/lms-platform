import { getBlockType } from "../../blockTypes.jsx";

const COPY = {
    TEXT: {
        title: "Tytuł rozdziału",
        titlePlaceholder: "Np. Czym jest programowanie?",
        content: "Treść materiału",
        contentPlaceholder: "Wyjaśnij temat krok po kroku..."
    },
    TIP: {
        title: "Tytuł wskazówki",
        titlePlaceholder: "Np. Szybszy sposób",
        content: "Treść wskazówki",
        contentPlaceholder: "Podaj krótką, praktyczną poradę..."
    },
    WARNING: {
        title: "Tytuł ostrzeżenia",
        titlePlaceholder: "Np. Uważaj na typ danych",
        content: "Co może pójść źle?",
        contentPlaceholder: "Opisz błąd, jego skutek i sposób uniknięcia..."
    },
    INFO: {
        title: "Tytuł informacji",
        titlePlaceholder: "Np. Warto wiedzieć",
        content: "Dodatkowy kontekst",
        contentPlaceholder: "Dodaj definicję albo informację uzupełniającą..."
    },
    SUMMARY: {
        title: "Tytuł podsumowania",
        titlePlaceholder: "Np. Co już potrafisz?",
        content: "Najważniejsze punkty",
        contentPlaceholder: "Wypisz po jednym punkcie w każdym wierszu..."
    }
};

export default function TextBlockForm({ block, setBlock }) {
    const type = getBlockType(block.type);
    const copy = COPY[block.type] || COPY.TEXT;
    const content = block.content || "";
    const wordCount = content.trim()
        ? content.trim().split(/\s+/).length
        : 0;

    function update(field, value) {
        setBlock(previous => ({ ...previous, [field]: value }));
    }

    return (
        <div className={`space-y-7 rounded-3xl border p-5 sm:p-7 ${type?.surface || "bg-gray-800"} ${type?.border || "border-gray-700"}`}>
            <div className="flex items-start gap-4">
                <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl ${type?.iconBox || "bg-blue-500/20 text-blue-200"}`}>
                    {type?.icon}
                </div>
                <div>
                    <h3 className="font-black text-white">{type?.label || "Tekst"}</h3>
                    <p className="mt-1 text-sm leading-6 text-gray-400">
                        {type?.description}
                    </p>
                </div>
            </div>

            <div className="max-w-4xl">
                <label className="mb-2 block font-semibold">{copy.title}</label>
                <input
                    value={block.title || ""}
                    placeholder={copy.titlePlaceholder}
                    onChange={event => update("title", event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-gray-950/80 px-4 py-3.5 text-lg font-bold outline-none transition focus:border-blue-400/50 focus:ring-4 focus:ring-blue-500/10"
                />
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-gray-950/80 shadow-inner">
                <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <label
                            htmlFor="lesson-block-content"
                            className="block font-semibold text-white"
                        >
                            {copy.content}
                        </label>
                        <p className="mt-0.5 text-xs text-gray-500">
                            Pisz naturalnie — układ rozdziału utworzy się automatycznie.
                        </p>
                    </div>
                    <p className="shrink-0 text-xs font-semibold text-gray-500">
                        {wordCount} {wordCount === 1 ? "słowo" : "słów"} · {content.length} znaków
                    </p>
                </div>
                <textarea
                    id="lesson-block-content"
                    value={content}
                    placeholder={copy.contentPlaceholder}
                    onChange={event => update("content", event.target.value)}
                    spellCheck="true"
                    aria-describedby="lesson-content-format-help"
                    className={`w-full resize-y bg-transparent px-5 py-6 text-[17px] leading-8 text-gray-100 outline-none placeholder:text-gray-600 sm:px-7 ${
                        block.type === "SUMMARY"
                            ? "min-h-72"
                            : "min-h-[34rem]"
                    }`}
                />
                <div
                    id="lesson-content-format-help"
                    className="border-t border-white/10 px-4 py-3"
                >
                    {block.type === "SUMMARY" ? (
                        <p className="text-xs text-emerald-200/70">
                            Każdy nowy wiersz zostanie pokazany jako osobny punkt podsumowania.
                        </p>
                    ) : (
                        <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-gray-400">
                            <span className="rounded-full bg-white/[0.05] px-3 py-1.5">
                                Nowa linia — nowy akapit
                            </span>
                            <span className="rounded-full bg-white/[0.05] px-3 py-1.5">
                                „- element” — lista
                            </span>
                            <span className="rounded-full bg-white/[0.05] px-3 py-1.5">
                                „# Tytuł” — śródtytuł
                            </span>
                            <span className="rounded-full bg-white/[0.05] px-3 py-1.5">
                                „Pojęcie: opis” — definicja
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

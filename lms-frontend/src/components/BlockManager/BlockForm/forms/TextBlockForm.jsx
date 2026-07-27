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

    function update(field, value) {
        setBlock(previous => ({ ...previous, [field]: value }));
    }

    return (
        <div className={`space-y-5 rounded-3xl border p-5 sm:p-6 ${type?.surface || "bg-gray-800"} ${type?.border || "border-gray-700"}`}>
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

            <div>
                <label className="mb-2 block font-semibold">{copy.title}</label>
                <input
                    value={block.title || ""}
                    placeholder={copy.titlePlaceholder}
                    onChange={event => update("title", event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-gray-950/70 p-3 outline-none focus:border-white/30"
                />
            </div>

            <div>
                <label className="mb-2 block font-semibold">{copy.content}</label>
                <textarea
                    value={block.content || ""}
                    placeholder={copy.contentPlaceholder}
                    onChange={event => update("content", event.target.value)}
                    className="min-h-56 w-full resize-y rounded-2xl border border-white/10 bg-gray-950/70 p-4 leading-7 outline-none focus:border-white/30"
                />
                {block.type === "SUMMARY" && (
                    <p className="mt-2 text-xs text-emerald-200/70">
                        Każdy nowy wiersz zostanie pokazany jako osobny punkt podsumowania.
                    </p>
                )}
            </div>
        </div>
    );
}

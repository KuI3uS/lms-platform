import {
    BsCardText,
    BsLightbulb,
    BsExclamationTriangle,
    BsInfoCircle,
    BsCheckCircle,
    BsImage,
    BsCodeSlash,
    BsPlayBtn,
    BsQuestionCircle,
    BsDownload,
    BsQuote,
    BsDashLg
} from "react-icons/bs";

export const BLOCK_TYPES = [
    {
        value: "TEXT",
        label: "Tekst",
        description: "Rozdział teorii z tytułem i czytelną treścią.",
        icon: <BsCardText />,
        surface: "bg-slate-500/10",
        border: "border-slate-500/25",
        selected: "border-slate-300 bg-slate-500/20 shadow-slate-950/30",
        iconBox: "bg-slate-400/15 text-slate-200"
    },
    {
        value: "TIP",
        label: "Wskazówka",
        description: "Krótka porada, skrót albo dobra praktyka.",
        icon: <BsLightbulb />,
        surface: "bg-violet-500/10",
        border: "border-violet-500/25",
        selected: "border-violet-300 bg-violet-500/20 shadow-violet-950/30",
        iconBox: "bg-violet-400/15 text-violet-200"
    },
    {
        value: "WARNING",
        label: "Ostrzeżenie",
        description: "Ważny błąd, ryzyko albo rzecz do zapamiętania.",
        icon: <BsExclamationTriangle />,
        surface: "bg-amber-500/10",
        border: "border-amber-500/25",
        selected: "border-amber-300 bg-amber-500/20 shadow-amber-950/30",
        iconBox: "bg-amber-400/15 text-amber-200"
    },
    {
        value: "INFO",
        label: "Informacja",
        description: "Dodatkowy kontekst lub ważna definicja.",
        icon: <BsInfoCircle />,
        surface: "bg-sky-500/10",
        border: "border-sky-500/25",
        selected: "border-sky-300 bg-sky-500/20 shadow-sky-950/30",
        iconBox: "bg-sky-400/15 text-sky-200"
    },
    {
        value: "SUMMARY",
        label: "Podsumowanie",
        description: "Najważniejsze punkty na końcu części lekcji.",
        icon: <BsCheckCircle />,
        surface: "bg-emerald-500/10",
        border: "border-emerald-500/25",
        selected: "border-emerald-300 bg-emerald-500/20 shadow-emerald-950/30",
        iconBox: "bg-emerald-400/15 text-emerald-200"
    },
    {
        value: "IMAGE",
        label: "Obraz",
        description: "Grafika z podpisem i możliwością powiększenia.",
        icon: <BsImage />,
        surface: "bg-fuchsia-500/10",
        border: "border-fuchsia-500/25",
        selected: "border-fuchsia-300 bg-fuchsia-500/20 shadow-fuchsia-950/30",
        iconBox: "bg-fuchsia-400/15 text-fuchsia-200"
    },
    {
        value: "VIDEO",
        label: "Film",
        description: "Materiał YouTube albo bezpośredni plik wideo.",
        icon: <BsPlayBtn />,
        surface: "bg-rose-500/10",
        border: "border-rose-500/25",
        selected: "border-rose-300 bg-rose-500/20 shadow-rose-950/30",
        iconBox: "bg-rose-400/15 text-rose-200"
    },
    {
        value: "EXAMPLE",
        label: "Przykład kodu",
        description: "Kod z językiem, opisem i przyciskiem kopiowania.",
        icon: <BsCodeSlash />,
        surface: "bg-teal-500/10",
        border: "border-teal-500/25",
        selected: "border-teal-300 bg-teal-500/20 shadow-teal-950/30",
        iconBox: "bg-teal-400/15 text-teal-200"
    },
    {
        value: "TASK",
        label: "Zadanie",
        description: "Ćwiczenie sprawdzane automatycznie z podpowiedziami.",
        icon: <BsCodeSlash />,
        surface: "bg-blue-500/10",
        border: "border-blue-500/25",
        selected: "border-blue-300 bg-blue-500/20 shadow-blue-950/30",
        iconBox: "bg-blue-400/15 text-blue-200"
    },
    {
        value: "QUIZ",
        label: "Quiz",
        description: "Pytanie jednokrotnego wyboru z odpowiedziami.",
        icon: <BsQuestionCircle />,
        surface: "bg-indigo-500/10",
        border: "border-indigo-500/25",
        selected: "border-indigo-300 bg-indigo-500/20 shadow-indigo-950/30",
        iconBox: "bg-indigo-400/15 text-indigo-200"
    },
    {
        value: "PDF",
        label: "Plik",
        description: "Załącznik do pobrania: PDF, ZIP albo dokument.",
        icon: <BsDownload />,
        surface: "bg-cyan-500/10",
        border: "border-cyan-500/25",
        selected: "border-cyan-300 bg-cyan-500/20 shadow-cyan-950/30",
        iconBox: "bg-cyan-400/15 text-cyan-200"
    },
    {
        value: "QUOTE",
        label: "Cytat",
        description: "Wyróżniona wypowiedź wraz z autorem lub źródłem.",
        icon: <BsQuote />,
        surface: "bg-orange-500/10",
        border: "border-orange-500/25",
        selected: "border-orange-300 bg-orange-500/20 shadow-orange-950/30",
        iconBox: "bg-orange-400/15 text-orange-200"
    },
    {
        value: "DIVIDER",
        label: "Separator",
        description: "Czytelne oddzielenie kolejnych części materiału.",
        icon: <BsDashLg />,
        surface: "bg-gray-500/10",
        border: "border-gray-500/25",
        selected: "border-gray-300 bg-gray-500/20 shadow-gray-950/30",
        iconBox: "bg-gray-400/15 text-gray-200"
    }
];

export const BLOCK_TYPES_MAP = Object.fromEntries(
    BLOCK_TYPES.map(type => [type.value, type])
);

export function getBlockType(type) {
    const normalizedType = ["THEORY", "CONTENT"].includes(type)
        ? "TEXT"
        : type === "DOWNLOAD"
            ? "PDF"
            : type;

    return BLOCK_TYPES_MAP[normalizedType];
}

export function getBlockIcon(type) {
    return getBlockType(type)?.icon;
}

export function getBlockLabel(type) {
    return getBlockType(type)?.label ?? type;
}

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
        icon: <BsCardText />
    },

    {
        value: "TIP",
        label: "Wskazówka",
        icon: <BsLightbulb />
    },

    {
        value: "WARNING",
        label: "Ostrzeżenie",
        icon: <BsExclamationTriangle />
    },

    {
        value: "INFO",
        label: "Informacja",
        icon: <BsInfoCircle />
    },

    {
        value: "SUMMARY",
        label: "Podsumowanie",
        icon: <BsCheckCircle />
    },

    {
        value: "IMAGE",
        label: "Obraz",
        icon: <BsImage />
    },

    {
        value: "VIDEO",
        label: "Film",
        icon: <BsPlayBtn />
    },

    {
        value: "EXAMPLE",
        label: "Przykład kodu",
        icon: <BsCodeSlash />
    },

    {
        value: "TASK",
        label: "Zadanie",
        icon: <BsCodeSlash />
    },

    {
        value: "QUIZ",
        label: "Quiz",
        icon: <BsQuestionCircle />
    },

    {
        value: "DOWNLOAD",
        label: "Plik",
        icon: <BsDownload />
    },

    {
        value: "QUOTE",
        label: "Cytat",
        icon: <BsQuote />
    },

    {
        value: "DIVIDER",
        label: "Separator",
        icon: <BsDashLg />
    }



];

export const BLOCK_TYPES_MAP = Object.fromEntries(
    BLOCK_TYPES.map(type => [type.value, type])
);

export function getBlockType(type) {
    return BLOCK_TYPES_MAP[type];
}

export function getBlockIcon(type) {
    return BLOCK_TYPES_MAP[type]?.icon;
}

export function getBlockLabel(type) {
    return BLOCK_TYPES_MAP[type]?.label ?? type;
}
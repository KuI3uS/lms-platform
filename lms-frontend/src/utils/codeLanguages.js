export const CODE_LANGUAGE_OPTIONS = [
    { value: "java", label: "Java" },
    { value: "javascript", label: "JavaScript" },
    { value: "python", label: "Python" },
    { value: "csharp", label: "C#" },
    { value: "sql", label: "SQL" },
    { value: "html", label: "HTML" },
    { value: "php", label: "PHP" },
    { value: "bash", label: "Bash" },
    { value: "powershell", label: "PowerShell" },
    { value: "json", label: "JSON" },
    { value: "yaml", label: "YAML" },
    { value: "xml", label: "XML" },
    { value: "dockerfile", label: "Dockerfile" },
    { value: "http", label: "HTTP" },
    { value: "markdown", label: "Markdown" },
    { value: "text", label: "Zwykły tekst" }
];

const CODE_LANGUAGE_VALUES = new Set(CODE_LANGUAGE_OPTIONS.map(option => option.value));
const CODE_LANGUAGE_ALIASES = {
    "c#": "csharp",
    shell: "bash",
    yml: "yaml",
    tekst: "text"
};

/** Normalize language metadata only; never transform the source code itself. */
export function normalizeCodeLanguage(value, fallback = "") {
    const token = String(value ?? "").trim().toLowerCase();
    if (CODE_LANGUAGE_VALUES.has(token)) return token;
    return CODE_LANGUAGE_ALIASES[token] || fallback;
}

export function getMonacoLanguage(value) {
    const language = normalizeCodeLanguage(value, "text");
    return { bash: "shell", text: "plaintext" }[language] || language;
}

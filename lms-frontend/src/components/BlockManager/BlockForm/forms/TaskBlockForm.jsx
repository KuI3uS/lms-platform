import {
    BsBook,
    BsCardText,
    BsCodeSlash,
    BsLightbulb,
    BsCheckCircle,
    BsGlobe
} from "react-icons/bs";
import { lazy, Suspense } from "react";
import { CODE_LANGUAGE_OPTIONS } from "../../../../utils/codeLanguages";

const MonacoEditorBox = lazy(() => import("../../../../pages/LessonPage/MonacoEditor"));

function EditorLoader() {
    return (
        <div className="flex min-h-72 items-center justify-center rounded-3xl border border-white/10 bg-gray-950 text-gray-400">
            Ładowanie edytora kodu...
        </div>
    );
}

function htmlTagText(source, tag) {
    const match = String(source || "").match(
        new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}\\s*>`, "i")
    );

    return match
        ? match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
        : "";
}

function htmlAttribute(source, tag, attribute) {
    const tagMatch = String(source || "").match(
        new RegExp(`<${tag}\\b([^>]*)>`, "i")
    );
    if (!tagMatch) return "";

    const attributeMatch = tagMatch[1].match(
        new RegExp(`${attribute}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i")
    );

    return attributeMatch
        ? attributeMatch[1] || attributeMatch[2] || attributeMatch[3] || ""
        : "";
}

function htmlTagTexts(source, tag) {
    const values = [];
    const expression = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}\\s*>`, "gi");
    let match;

    while ((match = expression.exec(String(source || ""))) !== null) {
        const value = match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (value) values.push(value);
    }

    return values;
}

function buildHtmlRequirements(source) {
    const html = String(source || "");
    const requirements = [];

    if (/<!doctype\s+html\s*>/i.test(html)) {
        requirements.push("Zastosuj deklarację dokumentu HTML5: <!DOCTYPE html>.");
    }

    const language = htmlAttribute(html, "html", "lang");
    if (language) {
        requirements.push(`Ustaw język dokumentu za pomocą <html lang="${language}">.`);
    }

    const charset = htmlAttribute(html, "meta", "charset");
    if (charset) {
        requirements.push(`W sekcji <head> ustaw kodowanie znaków: <meta charset="${charset}">.`);
    }

    const title = htmlTagText(html, "title");
    if (title) requirements.push(`Ustaw tytuł karty przeglądarki na: „${title}”.`);

    ["h1", "h2", "h3"].forEach(tag => {
        htmlTagTexts(html, tag).forEach(value => {
            requirements.push(`Dodaj nagłówek <${tag}> z treścią: „${value}”.`);
        });
    });

    htmlTagTexts(html, "p").forEach(value => {
        requirements.push(`Dodaj akapit <p> z treścią: „${value}”.`);
    });

    if (/<body\b/i.test(html) && requirements.length === 0) {
        requirements.push("Umieść wymaganą treść wewnątrz elementu <body>.");
    }

    return requirements;
}

export default function TaskBlockForm({

                                          block: task,

                                          setBlock,

                                          mode = "TASK"

                                      }) {

    function update(field, value) {

        setBlock(prev => ({
            ...prev,
            [field]: value
        }));

    }

    const isDebugging = mode === "DEBUGGING";
    const isPrediction = mode === "PREDICT_OUTPUT";
    const isHtml = !isPrediction && (task.language || "java") === "html";
    const formTitle = isDebugging
        ? "Debugowanie"
        : isPrediction
            ? "Przewidź wynik"
            : "Zadanie";
    const hasEmptyRequirements = isHtml
        && /Wymagania:\s*$/i.test(task.instruction || "");

    function fillHtmlRequirements() {
        const requirements = buildHtmlRequirements(task.expectedAnswer);
        if (requirements.length === 0) return;

        const instruction = String(task.instruction || "")
            .replace(/\n*Wymagania:\s*(?:\n[\s\S]*)?$/i, "")
            .trimEnd();
        const requirementList = requirements
            .map(requirement => `- ${requirement}`)
            .join("\n");

        update(
            "instruction",
            `${instruction}${instruction ? "\n\n" : ""}Wymagania:\n${requirementList}`
        );
    }

    return (

        <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-8">

            <div>

                <h2 className="text-2xl font-bold">

                    {task.id
                        ? `Edytuj: ${formTitle.toLowerCase()}`
                        : `Nowy blok: ${formTitle.toLowerCase()}`}

                </h2>

                <p className="text-gray-400 mt-1">
                    {isDebugging
                        ? "Dodaj kod z błędem, objaw, testy i progresywne podpowiedzi."
                        : isPrediction
                            ? "Uczeń analizuje kod i podaje wynik przed jego uruchomieniem."
                            : "Skonfiguruj zadanie praktyczne dla uczniów."}
                </p>

            </div>

            {/* ------------------------------------------------ */}
            {/* PODSTAWOWE */}
            {/* ------------------------------------------------ */}

            <div className="space-y-5">

                <h3 className="text-lg font-bold border-b border-gray-800 pb-2">
                    Podstawowe informacje
                </h3>

                <div className="space-y-2">

                    <label className="flex items-center gap-2 text-gray-300">

                        <BsBook />

                        Tytuł

                    </label>

                    <input
                        value={task.title || ""}
                        onChange={(e)=>update("title", e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
                        placeholder="Np. Pierwsza zmienna"
                    />

                </div>

                <div className="space-y-2">

                    <label className="flex items-center gap-2 text-gray-300">

                        <BsCardText />

                        {isDebugging ? "Objaw błędu" : "Opis"}

                    </label>

                    <textarea
                        value={task.description || ""}
                        onChange={(e)=>update("description", e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 min-h-28"
                        placeholder={isDebugging ? "Np. Program kompiluje się, ale zwraca błędną sumę..." : "Krótki opis zadania..."}
                    />

                </div>

                <div className="space-y-2">

                    <label className="flex items-center gap-2 text-gray-300">

                        <BsCardText />

                        {isDebugging ? "Zadanie naprawcze" : isPrediction ? "Pytanie do kodu" : "Polecenie"}

                    </label>

                    <textarea
                        value={task.instruction || ""}
                        onChange={(e)=>update("instruction", e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 min-h-40"
                        placeholder={isDebugging ? "Wyjaśnij, co uczeń ma naprawić i po czym pozna poprawny rezultat." : isPrediction ? "Np. Jaki dokładnie tekst wypisze ten program?" : "Treść zadania..."}
                    />

                    {hasEmptyRequirements && (
                        <p className="rounded-xl border border-amber-400/25 bg-amber-400/[0.08] px-4 py-3 text-sm text-amber-100">
                            Nagłówek „Wymagania” jest pusty. Uzupełnij go ręcznie albo użyj przycisku pod poprawną odpowiedzią.
                        </p>
                    )}

                </div>

            </div>

            {/* ------------------------------------------------ */}
            {/* KOD */}
            {/* ------------------------------------------------ */}

            <div className="space-y-5">

                <h3 className="text-lg font-bold border-b border-gray-800 pb-2">
                    Kod
                </h3>

                <div className="space-y-2">

                    <label className="flex items-center gap-2 text-gray-300">
                        <BsCodeSlash />
                        {isDebugging ? "Kod z błędem" : isPrediction ? "Kod do przeanalizowania" : "Kod startowy"}
                    </label>

                    <Suspense fallback={<EditorLoader />}>
                        <MonacoEditorBox
                            language={task.language}
                            value={task.starterCode || ""}
                            onChange={(value) => update("starterCode", value)}
                        />
                    </Suspense>

                </div>

                {!isPrediction && (task.language || "java") === "java" && (
                    <div className="space-y-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.05] p-4">
                        <label className="flex items-center gap-2 font-black text-cyan-200">
                            <BsCheckCircle /> Ukryte testy uruchomieniowe
                        </label>
                        <textarea
                            value={task.hiddenTests || ""}
                            onChange={(event) => update("hiddenTests", event.target.value)}
                            className="min-h-36 w-full rounded-xl border border-gray-700 bg-gray-950 p-4 font-mono text-sm"
                            placeholder={"<brak> => Hello World\\n5 => 25\\n-2 => 4"}
                        />
                        <p className="text-xs leading-5 text-slate-500">
                            Jeden test w wierszu: <strong className="text-slate-300">wejście =&gt; oczekiwane wyjście</strong>. Użyj <strong className="text-slate-300">&lt;brak&gt;</strong>, gdy program nie pobiera danych. Uczeń nie zobaczy wartości testów.
                        </p>
                    </div>
                )}

                <div className="space-y-2">

                    <label className="flex items-center gap-2 text-gray-300">

                        <BsGlobe />

                        Język

                    </label>

                    <select
                        value={task.language || "java"}
                        onChange={(e)=>update("language", e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
                    >

                        {CODE_LANGUAGE_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}

                    </select>

                </div>

            </div>

            {/* ------------------------------------------------ */}
            {/* SPRAWDZANIE */}
            {/* ------------------------------------------------ */}

            <div className="space-y-5">

                <h3 className="text-lg font-bold border-b border-gray-800 pb-2">
                    Sprawdzanie
                </h3>

                <div className="space-y-2">

                    <label className="flex items-center gap-2 text-gray-300">

                        <BsCheckCircle />

                        {isPrediction ? "Poprawny wynik programu" : isDebugging ? "Poprawiony kod" : "Poprawna odpowiedź"}

                    </label>

                    <Suspense fallback={<EditorLoader />}>
                        <MonacoEditorBox
                            language={task.language}
                            value={task.expectedAnswer || ""}
                            onChange={(value) => update("expectedAnswer", value)}
                        />
                    </Suspense>

                    {isHtml && (
                        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4 text-sm leading-6 text-cyan-50">
                            <p className="font-black">Elastyczne sprawdzanie HTML</p>
                            <p className="mt-1 text-cyan-100/75">
                                System użyje tego rozwiązania jako listy wymagań. Sprawdzi deklarację HTML5, znaczniki, ich liczbę, atrybuty oraz treść elementów. Nie będzie wymagał identycznych wcięć, układu linii ani wielkości liter.
                            </p>
                            <button
                                type="button"
                                onClick={fillHtmlRequirements}
                                disabled={!String(task.expectedAnswer || "").trim()}
                                className="mt-3 rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 font-black text-cyan-100 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Uzupełnij wymagania z rozwiązania
                            </button>
                        </div>
                    )}

                </div>

                <div className="space-y-2">

                    <label className="flex items-center gap-2 text-gray-300">

                        <BsLightbulb />

                        Podstawowa podpowiedź (1. błędna próba)

                    </label>

                    <textarea
                        value={task.hint || ""}
                        onChange={(e)=>update("hint", e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 min-h-32"
                        placeholder="Delikatnie naprowadź ucznia bez podawania gotowego rozwiązania."
                    />

                </div>

                <div className="space-y-2">

                    <label className="flex items-center gap-2 text-gray-300">

                        <BsLightbulb />

                        Dokładniejsza podpowiedź (od 2. błędnej próby)

                    </label>

                    <textarea
                        value={task.detailedHint || ""}
                        onChange={(e)=>update("detailedHint", e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 min-h-32"
                        placeholder="Wskaż konkretny fragment, składnię albo kolejny krok rozwiązania."
                    />

                </div>

                <div className="space-y-2">

                    <label className="flex items-center gap-2 text-gray-300">

                        <BsCheckCircle />

                        Wyjaśnienie rozwiązania (od 4. błędnej próby)

                    </label>

                    <textarea
                        value={task.solutionExplanation || ""}
                        onChange={(e)=>update("solutionExplanation", e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 min-h-36"
                        placeholder="Wyjaśnij, dlaczego poprawne rozwiązanie działa. System pokaże wtedy również przykładowy kod."
                    />

                </div>

            </div>

        </section>

    );

}

import { useLocale } from "../context/LocaleContext.jsx";
import { useMemo, useState } from "react";
import {
    BsCheckCircle,
    BsClipboard,
    BsCloudArrowUp,
    BsExclamationTriangle,
    BsFileEarmarkText,
    BsStars,
    BsX
} from "react-icons/bs";
import { useFeedback } from "../context/FeedbackContext";
import { cleanChatGptText } from "../utils/chatGptReferences";
import { getImportRepairPrompt } from "../utils/lessonImportPrompt";
import {
    getStageLessonPrompt,
    parseStageLessonImport,
    matchStageLessons,
    MAX_LESSONS_PER_STAGE_IMPORT
} from "../utils/stageLessonImport";

export default function StageLessonPackageImport({
    moduleTitle,
    currentLessons,
    maxBlocks,
    variant,
    lessonsState
}) {
    const { t } = useLocale();
    const { confirm, showToast } = useFeedback();
    const [open, setOpen] = useState(false);
    const [source, setSource] = useState("");
    const [importError, setImportError] = useState("");
    const [publishLessons, setPublishLessons] = useState(true);
    const [promptStart, setPromptStart] = useState(1);
    const [promptEnd, setPromptEnd] = useState(null);
    const end = Math.min(promptEnd ?? currentLessons.length, currentLessons.length);
    const promptLessons = currentLessons.slice(promptStart - 1, end);
    const parsed = useMemo(
        () => parseStageLessonImport(source, maxBlocks, variant),
        [source, maxBlocks, variant]
    );
    const matched = useMemo(() => matchStageLessons(parsed.lessons, currentLessons), [parsed.lessons, currentLessons]);
    const errors = [...parsed.errors, ...matched.errors];
    const canImport = parsed.lessonCount > 0
        && errors.length === 0
        && !lessonsState.packageImporting
        && !lessonsState.publishingReady
        && !lessonsState.loading;

    const copyPrompt = async () => {
        try {
            await navigator.clipboard.writeText(getStageLessonPrompt({
                maxBlocks,
                variant,
                stageTitle: moduleTitle,
                lessonTitles: promptLessons.map(lesson => lesson.title)
            }));
            showToast(
                currentLessons.length > 0
                    ? `Skopiowano prompt dla ${promptLessons.length} lekcji z wybranego zakresu.`
                    : "Skopiowano wzór promptu dla całego etapu.",
                "success"
            );
        } catch {
            showToast("Nie udało się skopiować promptu.", "error");
        }
    };

    const copyRepair = async () => {
        try {
            await navigator.clipboard.writeText(getImportRepairPrompt({
                source,
                errors: [...errors, ...(importError ? [importError] : [])],
                contract: getStageLessonPrompt({ maxBlocks, variant, stageTitle: moduleTitle, lessonTitles: currentLessons.map(lesson => lesson.title) }),
                scope: "paczkę lekcji"
            }));
            showToast("Skopiowano pakiet i konkretne błędy. Wklej do ChatGPT, a jego poprawioną odpowiedź ponownie tutaj.", "success");
        } catch {
            showToast("Nie udało się skopiować polecenia naprawy.", "error");
        }
    };

    const loadFile = async event => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;

        try {
            setSource(cleanChatGptText(await file.text()));
            setImportError("");
        } catch {
            showToast("Nie udało się odczytać pliku.", "error");
        }
    };

    const importPackage = async () => {
        if (!canImport) return;

        const accepted = await confirm({
            title: "Zaimportuj cały etap",
            message: `Uzupełnić bloki w ${parsed.lessonCount} istniejących lekcjach? Import nie utworzy żadnej nowej lekcji. ${publishLessons ? "Lekcje mające opublikowane bloki zostaną udostępnione uczniom z dostępem do kursu, również gdy ich treść została zaimportowana wcześniej." : "Status publikacji pozostanie bez zmian."} Lekcje mające już bloki nie zostaną nadpisane.`,
            confirmLabel: "Uzupełnij istniejące lekcje",
            danger: false
        });
        if (!accepted) return;

        try {
            setImportError("");
            const result = await lessonsState.importLessonPackage(parsed.lessons, { publishLessons });
            const details = [
                result.lessonsFilled ? `uzupełnione lekcje: ${result.lessonsFilled}` : "",
                result.lessonsSkipped ? `treść bez zmian: ${result.lessonsSkipped}` : "",
                result.lessonsPublished ? `opublikowane lekcje: ${result.lessonsPublished}` : ""
            ].filter(Boolean).join(", ");

            showToast(
                `Zaimportowano ${result.blocksCreated} bloków${details ? ` (${details})` : ""}.`,
                "success"
            );
            setSource("");
            setOpen(false);
        } catch (error) {
            const message = `${error?.message || "Nie udało się potwierdzić importu."} Odśwież listę przed ponowną próbą. Ponowny import nie nadpisze zapisanych bloków.`;
            setImportError(message);
            showToast(message, "error");
        }
    };

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-violet-400/25 bg-violet-500/[0.09] px-5 py-4 font-black text-violet-100 transition hover:border-violet-300/50 hover:bg-violet-500/[0.15]"
            >
                <BsStars />{t("Importuj bloki do istniejących lekcji etapu")}</button>
        );
    }

    const progress = lessonsState.packageImportProgress;

    return (
        <section className="rounded-[32px] border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.10] via-slate-950 to-blue-500/[0.08] p-5 sm:p-7">
            <header className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">{t("Import całego etapu")}</p>
                    <h2 className="mt-2 text-2xl font-black text-white">{t("Uzupełnij bloki istniejących lekcji")}</h2>
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">{t("Skopiuj wzór do ChatGPT i wklej tutaj jego gotową odpowiedź. Paczka może obejmować do ")}{MAX_LESSONS_PER_STAGE_IMPORT}{t(" istniejących lekcji, po maksymalnie ")}{maxBlocks}{t(" bloków. Import dopasowuje tytuły i nigdy nie tworzy dodatkowych kart.")}</p>
                </div>
                <button
                    type="button"
                    aria-label={t("Zamknij import całego etapu")}
                    disabled={lessonsState.packageImporting}
                    onClick={() => setOpen(false)}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                >
                    <BsX className="text-xl" />
                </button>
            </header>

            {currentLessons.length === 0 && <p role="status" className="mt-4 rounded-xl border border-amber-400/25 bg-amber-500/10 p-4 text-sm text-amber-100">{t("Najpierw utwórz lekcje w tym etapie. Dopiero potem importuj ich bloki.")}</p>}

            {currentLessons.length > 0 && <fieldset disabled={lessonsState.packageImporting} className="mt-5 rounded-xl border border-white/10 bg-black/15 p-4">
                <legend className="px-2 text-sm font-bold text-slate-200">{t("Zakres lekcji do przygotowania")}</legend>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                    <label className="inline-flex items-center gap-2">{t("Od ")}<input aria-label={t("Prompt od lekcji")} type="number" min="1" max={currentLessons.length} value={promptStart} onChange={event => setPromptStart(Math.max(1, Math.min(Number(event.target.value) || 1, currentLessons.length)))} className="w-20 rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-white" /></label>
                    <label className="inline-flex items-center gap-2">{t("do ")}<input aria-label={t("Prompt do lekcji")} type="number" min="1" max={currentLessons.length} value={end} onChange={event => setPromptEnd(Math.max(1, Math.min(Number(event.target.value) || 1, currentLessons.length)))} className="w-20 rounded-lg border border-white/20 bg-slate-950 px-3 py-2 text-white" /></label>
                    <button type="button" onClick={() => { const first = currentLessons.findIndex(lesson => !lesson.blockCount); const start = first < 0 ? 1 : first + 1; setPromptStart(start); setPromptEnd(Math.min(start + 2, currentLessons.length)); }} className="rounded-lg border border-cyan-300/25 px-3 py-2 font-bold text-cyan-200 hover:bg-cyan-500/10">{t("Mniejsza paczka: 3 lekcje")}</button>
                    <button type="button" onClick={() => { setPromptStart(1); setPromptEnd(null); }} className="rounded-lg px-3 py-2 text-slate-300 hover:bg-white/5">{t("Cały etap")}</button>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-400">{t("Duże odpowiedzi ChatGPT mogą się urwać. Dla rozbudowanych lekcji wybierz po 2–3 naraz; kolejne zakresy dodasz do tych samych kart. Import nadal obsługuje do 50 lekcji w jednej paczce.")}</p>
                {promptStart > end && <p role="alert" className="mt-2 text-sm text-red-200">{t("Początek zakresu nie może być większy od końca.")}</p>}
                {promptLessons.length > MAX_LESSONS_PER_STAGE_IMPORT && <p role="alert" className="mt-2 text-sm text-red-200">{t("Wybierz zakres do ")}{MAX_LESSONS_PER_STAGE_IMPORT}{t(" lekcji. Większy etap przygotujesz w kolejnych paczkach.")}</p>}
            </fieldset>}

            <div className="mt-6 flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={copyPrompt}
                    disabled={currentLessons.length === 0 || promptLessons.length === 0 || promptLessons.length > MAX_LESSONS_PER_STAGE_IMPORT || lessonsState.loading || lessonsState.packageImporting}
                    className="inline-flex items-center gap-2 rounded-xl border border-violet-300/20 bg-violet-500/10 px-4 py-2.5 text-sm font-black text-violet-100 transition hover:bg-violet-500/20 disabled:opacity-40"
                >
                    <BsClipboard /> {promptLessons.length === currentLessons.length ? t("Skopiuj prompt dla całego etapu") : t("Skopiuj prompt: {value0} lekcji z zakresu", { value0: promptLessons.length })}
                </button>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-black text-slate-200 transition hover:bg-white/10">
                    <BsFileEarmarkText />{t(" Wczytaj plik .txt lub .md")}<input
                        type="file"
                        accept=".txt,.md,text/plain,text/markdown"
                        onChange={loadFile}
                        disabled={lessonsState.packageImporting}
                        className="sr-only"
                    />
                </label>
            </div>

            <textarea
                value={source}
                disabled={lessonsState.packageImporting}
                onChange={event => {
                    setSource(cleanChatGptText(event.target.value));
                    setImportError("");
                }}
                rows={18}
                placeholder={t("LEKCJA 1 — Tworzymy pierwsze repozytorium Git\nKROK 1\nTyp bloku\nTekst\n...\nKONIEC LEKCJI\n\nLEKCJA 2 — git status\nKROK 1\n...")}
                className="mt-5 w-full resize-y rounded-2xl border border-white/10 bg-slate-950/85 p-4 font-mono text-sm leading-6 text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-violet-400 disabled:opacity-60"
            />

            {source.trim() && (
                <div className="mt-5 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <Summary value={parsed.lessonCount} label={t("rozpoznanych lekcji")} />
                        <Summary value={parsed.blockCount} label={t("wszystkich bloków")} />
                        <Summary value={maxBlocks} label={t("maks. bloków w lekcji")} />
                    </div>

                    <div className={`rounded-2xl border p-4 ${
                        errors.length > 0
                            ? "border-red-400/25 bg-red-500/10"
                            : "border-emerald-400/25 bg-emerald-500/10"
                    }`}>
                        <p className="flex items-center gap-2 font-black text-white">
                            {errors.length > 0
                                ? <BsExclamationTriangle className="text-red-300" />
                                : <BsCheckCircle className="text-emerald-300" />}
                            {errors.length > 0
                                ? t("Pakiet wymaga poprawy")
                                : t("Wszystkie lekcje dopasowane — można zapisać bloki")}
                        </p>
                        {errors.slice(0, 8).map(error => (
                            <p key={error} className="mt-2 text-sm leading-6 text-red-200">{error}</p>
                        ))}
                        {parsed.warnings.slice(0, 8).map(warning => (
                            <p key={warning} className="mt-2 text-sm leading-6 text-amber-200">{warning}</p>
                        ))}
                        {(errors.length > 0 || importError) && <button type="button" onClick={copyRepair} disabled={lessonsState.packageImporting} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-300/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100 hover:bg-red-500/20 disabled:opacity-40">
                            <BsClipboard aria-hidden="true" />{t(" Skopiuj polecenie naprawy do ChatGPT")}</button>}
                    </div>

                    {parsed.lessons.length > 0 && (
                        <ol className="grid gap-2 sm:grid-cols-2">
                            {parsed.lessons.map((lesson, index) => {
                                const target = matched.matches.find(match => match.source === lesson)?.target;
                                return (
                                <li key={`${lesson.number}-${lesson.title}-${index}`} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                                    <p className="text-xs font-black uppercase tracking-wider text-violet-300">{t("Lekcja ")}{lesson.number} · {lesson.blocks.length} {lesson.blocks.length === 1 ? t("blok") : t("bloków")}
                                    </p>
                                    <p className="mt-1 font-bold text-slate-200">{lesson.title || t("Brak tytułu")}</p>
                                    <p className={`mt-2 text-xs leading-5 ${target ? "text-emerald-200" : "text-red-200"}`}>
                                        {!target ? t("Brak jednoznacznego dopasowania — zapis zablokowany") : t("→ Istniejąca lekcja {value0}: {value1}", { value0: target.displayNumber, value1: target.title })}
                                    </p>
                                    {target && <p className="mt-1 text-xs leading-5 text-slate-400">{target.blockCount > 0 ? publishLessons && !target.published && target.publishedBlockCount > 0 ? t("Treść pozostanie bez zmian; lekcja zostanie opublikowana.") : t("Lekcja ma już bloki — treść pozostanie bez zmian.") : t("Bloki do dodania do tej karty: {value0}.", { value0: lesson.blocks.length })}</p>}
                                </li>
                            );})}
                        </ol>
                    )}
                </div>
            )}

            {importError && (
                <div role="alert" className="mt-4 rounded-2xl border border-red-400/25 bg-red-500/10 p-4 text-sm leading-6 text-red-200">
                    {importError}
                </div>
            )}

            {lessonsState.packageImporting && progress && (
                <div className="mt-4 rounded-2xl border border-blue-400/25 bg-blue-500/10 p-4 text-sm text-blue-100">
                    <p className="font-black">{t("Sprawdzanie i zapisywanie pakietu ")}{progress.total}{t(" lekcji…")}</p>
                    <p className="mt-1 text-blue-200/80">{t("Pakiet jest zapisywany w jednej operacji. Jeśli walidacja nie przejdzie, żadna lekcja nie zostanie zmieniona.")}</p>
                </div>
            )}

            <label className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                <input type="checkbox" checked={publishLessons} disabled={lessonsState.packageImporting} onChange={event => setPublishLessons(event.target.checked)} className="mt-1 h-4 w-4 shrink-0" />
                <span><strong className="block">{t("Opublikuj dopasowane lekcje z materiałami")}</strong><span className="mt-1 block leading-6 text-emerald-100/75">{t("Dotyczy także lekcji mających już opublikowane bloki — bez ich nadpisywania. Puste lekcje i ukryte bloki nie zostaną udostępnione. Odznacz, aby zachować obecne statusy.")}</span></span>
            </label>

            <button
                type="button"
                disabled={!canImport}
                onClick={importPackage}
                className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-4 font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
                {lessonsState.packageImporting
                    ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    : <BsCloudArrowUp />}
                {lessonsState.packageImporting
                    ? t("Importowanie całego etapu...")
                    : t("Uzupełnij bloki w {value0} istniejących lekcjach", { value0: parsed.lessonCount || 0 })}
            </button>
        </section>
    );
}

function Summary({ value, label }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <strong className="block text-2xl text-white">{value}</strong>
            <span className="text-xs text-slate-500">{label}</span>
        </div>
    );
}

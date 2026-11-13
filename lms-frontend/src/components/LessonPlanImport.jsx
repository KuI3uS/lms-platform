import { useLocale } from "../context/LocaleContext.jsx";
import { useMemo, useState } from "react";
import {
    BsCheckCircle,
    BsCloudArrowUp,
    BsFileEarmarkText,
    BsX
} from "react-icons/bs";
import { apiFetch } from "../api/api";
import { useFeedback } from "../context/FeedbackContext";
import { parseLessonPlan, previewLessonPlan, buildLessonPlanBatches } from "../utils/lessonPlanImport";

export default function LessonPlanImport({ courseId, moduleCount, existingModules = [], onImported }) {
    const { t } = useLocale();
    const { confirm, showToast } = useFeedback();
    const [open, setOpen] = useState(false);
    const [source, setSource] = useState("");
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(null);
    const parsed = useMemo(() => parseLessonPlan(source), [source]);
    const preview = useMemo(() => previewLessonPlan(parsed.stages, existingModules), [parsed.stages, existingModules]);
    const errors = [...parsed.errors, ...preview.errors];
    const canImport = parsed.lessonCount > 0
        && errors.length === 0
        && !importing;

    const loadFile = async event => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;

        try {
            setSource(await file.text());
        } catch {
            showToast("Nie udało się odczytać pliku.", "error");
        }
    };

    const importPlan = async () => {
        if (!canImport) return;
        const accepted = await confirm({
            title: "Zaimportuj plan etapów i lekcji",
            message: `Dodać brakujące etapy (${preview.stagesToCreate}) i sprawdzić ${parsed.lessonCount} tematów lekcji? Etapy dopasowujemy po nazwie. Istniejące etapy i lekcje nie zostaną nadpisane ani powielone. Nowe lekcje będą pustymi szkicami, których bloki dodasz osobnym importem. Duże plany zapisujemy partiami.`,
            confirmLabel: "Importuj etapy i lekcje",
            danger: false
        });
        if (!accepted) return;

        try {
            setImporting(true);
            const stageChunks = buildLessonPlanBatches(parsed.stages);
            const result = {
                stagesUpdated: 0,
                lessonsCreated: 0,
                duplicatesSkipped: 0,
                stagesCreated: 0
            };

            for (let index = 0; index < stageChunks.length; index += 1) {
                setProgress({ current: index + 1, total: stageChunks.length });
                const chunkResult = await apiFetch(`/lessons/course/${courseId}/bulk-plan`, {
                    method: "POST",
                    body: JSON.stringify({
                        stages: stageChunks[index].map(stage => ({
                            stageNumber: stage.stageNumber,
                            stageTitle: stage.stageTitle,
                            lessonTitles: stage.lessonTitles
                        }))
                    })
                });
                result.stagesUpdated += chunkResult?.stagesUpdated || 0;
                result.lessonsCreated += chunkResult?.lessonsCreated || 0;
                result.duplicatesSkipped += chunkResult?.duplicatesSkipped || 0;
                result.stagesCreated += chunkResult?.stagesCreated || 0;
            }
            await onImported?.(result);
            setSource("");
            setOpen(false);
            showToast(
                `Dodano etapów: ${result.stagesCreated}, szkielety lekcji: ${result.lessonsCreated}.${result.duplicatesSkipped ? ` Pominięto istniejące lekcje: ${result.duplicatesSkipped}.` : ""}`,
                "success"
            );
        } catch (error) {
            showToast(
                `${error?.message || "Nie udało się zaimportować planu lekcji."} Możesz uruchomić import ponownie — zapisane partie zostaną rozpoznane jako duplikaty i pominięte.`,
                "error"
            );
        } finally {
            setImporting(false);
            setProgress(null);
        }
    };

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-cyan-400/25 bg-cyan-500/[0.08] px-5 py-4 font-black text-cyan-200 transition hover:border-cyan-300/45 hover:bg-cyan-500/[0.14] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
            >
                <BsCloudArrowUp className="text-xl" />{t("Importuj plan — utwórz etapy i szkielety lekcji")}</button>
        );
    }

    return (
        <section className="rounded-3xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.09] via-slate-950 to-blue-500/[0.08] p-5 sm:p-7">
            <header className="flex items-start justify-between gap-5">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">{t("Import zbiorczy")}</p>
                    <h2 className="mt-2 text-2xl font-black">{t("Wklej cały plan etapów i lekcji")}</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">{t("Wklej „ETAP 1 — nazwa”, a pod nim „Lekcje: temat 1; temat 2; temat 3”. Ten import tworzy brakujące etapy i puste szkielety lekcji — także w pustym kursie. Bez limitu liczby etapów i tematów w całym planie: duże plany zapisujemy automatycznie partiami. Bloki uzupełnisz później importem wewnątrz etapu.")}</p>
                </div>
                <button
                    type="button"
                    aria-label={t("Zamknij import lekcji")}
                    onClick={() => setOpen(false)}
                    disabled={importing}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-gray-400 transition hover:bg-white/10 hover:text-white"
                >
                    <BsX className="text-2xl" />
                </button>
            </header>

            <div className="mt-6 flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-black text-gray-200 transition hover:bg-white/10">
                    <BsFileEarmarkText />{t("Wczytaj plik .txt lub .md")}<input
                        type="file"
                        accept=".txt,.md,text/plain,text/markdown"
                        onChange={loadFile}
                        disabled={importing}
                        className="sr-only"
                    />
                </label>
                <span className="text-xs text-gray-500">{t("albo wklej tekst poniżej")}</span>
            </div>

            <textarea
                value={source}
                disabled={importing}
                onChange={event => setSource(event.target.value)}
                rows={14}
                placeholder={t("## ETAP 16 — Operatory warunkowe\nLekcje: Kilka kryteriów naraz; AND w praktyce; OR w praktyce")}
                className="mt-4 w-full resize-y rounded-2xl border border-white/10 bg-slate-950/80 p-4 font-mono text-sm leading-6 text-gray-100 outline-none transition placeholder:text-slate-700 focus:border-cyan-400"
            />

            {source.trim() && (
                <div className="mt-5 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <Summary value={parsed.stages.length} label={t("rozpoznanych etapów")} />
                        <Summary value={parsed.lessonCount} label={t("lekcji do sprawdzenia")} />
                        <Summary value={preview.stagesToCreate} label={t("nowych etapów do utworzenia")} />
                    </div>

                    <p className="text-sm leading-6 text-slate-400">{t("Etapy już w kursie: ")}{moduleCount}{t(". Dopasowania po nazwie: ")}{preview.stagesToReuse}{t(". Istniejące lekcje nie zostaną powielone ani nadpisane.")}</p>
                    {errors.length > 0 && (
                        <Message tone="error">
                            {errors.slice(0, 5).map(error => (
                                <span key={error} className="block">{error}</span>
                            ))}
                        </Message>
                    )}
                    {canImport && (
                        <Message tone="success">
                            <span className="inline-flex items-center gap-2 font-bold">
                                <BsCheckCircle />{t(" Plan jest gotowy do importu.")}</span>
                        </Message>
                    )}
                </div>
            )}

            <button
                type="button"
                disabled={!canImport}
                onClick={importPlan}
                className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-4 font-black text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
            >
                <BsCloudArrowUp />
                {importing
                    ? t("Importowanie partii {value0} z {value1}...", { value0: progress?.current || 1, value1: progress?.total || 1 })
                    : t("Importuj plan: {value0} etapów · {value1} lekcji", { value0: parsed.stages.length, value1: parsed.lessonCount || 0 })}
            </button>
        </section>
    );
}

function Summary({ value, label }) {
    return (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <strong className="block text-2xl text-white">{value}</strong>
            <span className="text-xs text-gray-500">{label}</span>
        </div>
    );
}

function Message({ tone, children }) {
    const style = tone === "success"
        ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
        : "border-red-400/25 bg-red-500/10 text-red-200";
    return (
        <div className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${style}`}>
            {children}
        </div>
    );
}

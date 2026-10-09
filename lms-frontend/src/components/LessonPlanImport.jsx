import { useMemo, useState } from "react";
import {
    BsCheckCircle,
    BsCloudArrowUp,
    BsFileEarmarkText,
    BsX
} from "react-icons/bs";
import { apiFetch } from "../api/api";
import { useFeedback } from "../context/FeedbackContext";
import { parseLessonPlan } from "../utils/lessonPlanImport";

const STAGES_PER_REQUEST = 20;

export default function LessonPlanImport({ courseId, moduleCount, onImported }) {
    const { confirm, showToast } = useFeedback();
    const [open, setOpen] = useState(false);
    const [source, setSource] = useState("");
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(null);
    const parsed = useMemo(() => parseLessonPlan(source), [source]);
    const missingStages = parsed.stages.filter(
        stage => stage.stageNumber > moduleCount
    );
    const canImport = parsed.lessonCount > 0
        && parsed.errors.length === 0
        && missingStages.length === 0
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
            title: "Zaimportuj spis lekcji",
            message: `Utworzyć ${parsed.lessonCount} lekcji w ${parsed.stages.length} etapach? Nowe lekcje zostaną zapisane jako nieopublikowane szkielety. Istniejące lekcje o tej samej nazwie nie zostaną powielone.`,
            confirmLabel: "Importuj lekcje"
        });
        if (!accepted) return;

        try {
            setImporting(true);
            const stageChunks = [];
            for (let index = 0; index < parsed.stages.length; index += STAGES_PER_REQUEST) {
                stageChunks.push(parsed.stages.slice(index, index + STAGES_PER_REQUEST));
            }
            const result = {
                stagesUpdated: 0,
                lessonsCreated: 0,
                duplicatesSkipped: 0
            };

            for (let index = 0; index < stageChunks.length; index += 1) {
                setProgress({ current: index + 1, total: stageChunks.length });
                const chunkResult = await apiFetch(`/lessons/course/${courseId}/bulk-plan`, {
                    method: "POST",
                    body: JSON.stringify({
                        stages: stageChunks[index].map(stage => ({
                            stageNumber: stage.stageNumber,
                            lessonTitles: stage.lessonTitles
                        }))
                    })
                });
                result.stagesUpdated += chunkResult?.stagesUpdated || 0;
                result.lessonsCreated += chunkResult?.lessonsCreated || 0;
                result.duplicatesSkipped += chunkResult?.duplicatesSkipped || 0;
            }
            await onImported?.(result);
            setSource("");
            setOpen(false);
            showToast(
                `Utworzono ${result.lessonsCreated} lekcji w ${result.stagesUpdated} etapach.${result.duplicatesSkipped ? ` Pominięto duplikaty: ${result.duplicatesSkipped}.` : ""}`,
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
                <BsCloudArrowUp className="text-xl" />
                Importuj wiele lekcji z planu
            </button>
        );
    }

    return (
        <section className="rounded-3xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/[0.09] via-slate-950 to-blue-500/[0.08] p-5 sm:p-7">
            <header className="flex items-start justify-between gap-5">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                        Import zbiorczy
                    </p>
                    <h2 className="mt-2 text-2xl font-black">
                        Wklej cały plan etapów i lekcji
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-400">
                        Rozpoznawany format to „ETAP 16 — nazwa”, a pod nim „Lekcje: temat 1; temat 2; temat 3”. Import tworzy same szkielety lekcji — ich bloki uzupełnisz później.
                    </p>
                </div>
                <button
                    type="button"
                    aria-label="Zamknij import lekcji"
                    onClick={() => setOpen(false)}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-gray-400 transition hover:bg-white/10 hover:text-white"
                >
                    <BsX className="text-2xl" />
                </button>
            </header>

            <div className="mt-6 flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-black text-gray-200 transition hover:bg-white/10">
                    <BsFileEarmarkText />
                    Wczytaj plik .txt lub .md
                    <input
                        type="file"
                        accept=".txt,.md,text/plain,text/markdown"
                        onChange={loadFile}
                        className="sr-only"
                    />
                </label>
                <span className="text-xs text-gray-500">albo wklej tekst poniżej</span>
            </div>

            <textarea
                value={source}
                onChange={event => setSource(event.target.value)}
                rows={14}
                placeholder={'## ETAP 16 — Operatory warunkowe\nLekcje: Kilka kryteriów naraz; AND w praktyce; OR w praktyce'}
                className="mt-4 w-full resize-y rounded-2xl border border-white/10 bg-slate-950/80 p-4 font-mono text-sm leading-6 text-gray-100 outline-none transition placeholder:text-slate-700 focus:border-cyan-400"
            />

            {source.trim() && (
                <div className="mt-5 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <Summary value={parsed.stages.length} label="rozpoznanych etapów" />
                        <Summary value={parsed.lessonCount} label="lekcji do sprawdzenia" />
                        <Summary value={moduleCount} label="etapów w tym kursie" />
                    </div>

                    {parsed.errors.length > 0 && (
                        <Message tone="error">
                            {parsed.errors.slice(0, 5).map(error => (
                                <span key={error} className="block">{error}</span>
                            ))}
                        </Message>
                    )}
                    {missingStages.length > 0 && (
                        <Message tone="error">
                            Plan zawiera nieistniejące etapy: {missingStages
                                .slice(0, 10)
                                .map(stage => stage.stageNumber)
                                .join(", ")}.
                        </Message>
                    )}
                    {canImport && (
                        <Message tone="success">
                            <span className="inline-flex items-center gap-2 font-bold">
                                <BsCheckCircle /> Plan jest gotowy do importu.
                            </span>
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
                    ? `Importowanie partii ${progress?.current || 1} z ${progress?.total || 1}...`
                    : `Importuj ${parsed.lessonCount || 0} lekcji`}
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

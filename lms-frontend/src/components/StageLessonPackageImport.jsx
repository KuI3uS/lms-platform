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
import {
    getStageLessonPrompt,
    parseStageLessonImport
} from "../utils/stageLessonImport";

export default function StageLessonPackageImport({
    moduleTitle,
    currentLessons,
    maxBlocks,
    variant,
    lessonsState
}) {
    const { confirm, showToast } = useFeedback();
    const [open, setOpen] = useState(false);
    const [source, setSource] = useState("");
    const [importError, setImportError] = useState("");
    const parsed = useMemo(
        () => parseStageLessonImport(source, maxBlocks, variant),
        [source, maxBlocks, variant]
    );
    const canImport = parsed.lessonCount > 0
        && parsed.errors.length === 0
        && !lessonsState.packageImporting;

    const copyPrompt = async () => {
        try {
            await navigator.clipboard.writeText(getStageLessonPrompt({
                maxBlocks,
                variant,
                stageTitle: moduleTitle,
                lessonTitles: currentLessons.map(lesson => lesson.title)
            }));
            showToast(
                currentLessons.length > 0
                    ? `Skopiowano prompt dla ${currentLessons.length} lekcji tego etapu.`
                    : "Skopiowano wzór promptu dla całego etapu.",
                "success"
            );
        } catch {
            showToast("Nie udało się skopiować promptu.", "error");
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
            message: `Zapisać ${parsed.lessonCount} kompletnych lekcji i ${parsed.blockCount} bloków? Nowe lekcje pozostaną nieopublikowane do sprawdzenia. Puste lekcje o tych samych nazwach zostaną uzupełnione, a lekcje mające już bloki będą pominięte.`,
            confirmLabel: "Importuj cały etap"
        });
        if (!accepted) return;

        try {
            setImportError("");
            const result = await lessonsState.importLessonPackage(parsed.lessons);
            const details = [
                result.lessonsCreated ? `nowe lekcje: ${result.lessonsCreated}` : "",
                result.emptyLessonsFilled ? `uzupełnione puste lekcje: ${result.emptyLessonsFilled}` : "",
                result.lessonsSkipped ? `pominięte z treścią: ${result.lessonsSkipped}` : ""
            ].filter(Boolean).join(", ");

            showToast(
                `Zaimportowano ${result.blocksCreated} bloków${details ? ` (${details})` : ""}.`,
                "success"
            );
            setSource("");
            setOpen(false);
        } catch (error) {
            const partial = error?.packageResult;
            const saved = (partial?.lessonsCreated || 0) + (partial?.emptyLessonsFilled || 0);
            const message = saved > 0
                ? `${error?.message || "Import został przerwany."} Zapisano wcześniej ${saved} lekcji. Popraw błąd i uruchom import ponownie — gotowe lekcje zostaną bezpiecznie pominięte.`
                : error?.message || "Nie udało się zaimportować pakietu lekcji.";
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
                <BsStars />
                Importuj wszystkie lekcje tego etapu
            </button>
        );
    }

    const progress = lessonsState.packageImportProgress;

    return (
        <section className="rounded-[32px] border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.10] via-slate-950 to-blue-500/[0.08] p-5 sm:p-7">
            <header className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">
                        Import całego etapu
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-white">
                        Wklej wiele kompletnych lekcji naraz
                    </h2>
                    <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
                        Możesz wkleić np. 10 lekcji, każdą z maksymalnie {maxBlocks} blokami. EduHub rozdzieli lekcje, sprawdzi wszystkie pola i zapisze je kolejno. Istniejące puste karty zostaną uzupełnione automatycznie.
                    </p>
                </div>
                <button
                    type="button"
                    aria-label="Zamknij import całego etapu"
                    disabled={lessonsState.packageImporting}
                    onClick={() => setOpen(false)}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                >
                    <BsX className="text-xl" />
                </button>
            </header>

            <div className="mt-6 flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={copyPrompt}
                    className="inline-flex items-center gap-2 rounded-xl border border-violet-300/20 bg-violet-500/10 px-4 py-2.5 text-sm font-black text-violet-100 transition hover:bg-violet-500/20"
                >
                    <BsClipboard /> Skopiuj prompt dla całego etapu
                </button>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-black text-slate-200 transition hover:bg-white/10">
                    <BsFileEarmarkText /> Wczytaj plik .txt lub .md
                    <input
                        type="file"
                        accept=".txt,.md,text/plain,text/markdown"
                        onChange={loadFile}
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
                placeholder={'LEKCJA 1 — Tworzymy pierwsze repozytorium Git\nKROK 1\nTyp bloku\nTekst\n...\nKONIEC LEKCJI\n\nLEKCJA 2 — git status\nKROK 1\n...'}
                className="mt-5 w-full resize-y rounded-2xl border border-white/10 bg-slate-950/85 p-4 font-mono text-sm leading-6 text-slate-200 outline-none transition placeholder:text-slate-700 focus:border-violet-400 disabled:opacity-60"
            />

            {source.trim() && (
                <div className="mt-5 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                        <Summary value={parsed.lessonCount} label="rozpoznanych lekcji" />
                        <Summary value={parsed.blockCount} label="wszystkich bloków" />
                        <Summary value={maxBlocks} label="maks. bloków w lekcji" />
                    </div>

                    <div className={`rounded-2xl border p-4 ${
                        parsed.errors.length > 0
                            ? "border-red-400/25 bg-red-500/10"
                            : "border-emerald-400/25 bg-emerald-500/10"
                    }`}>
                        <p className="flex items-center gap-2 font-black text-white">
                            {parsed.errors.length > 0
                                ? <BsExclamationTriangle className="text-red-300" />
                                : <BsCheckCircle className="text-emerald-300" />}
                            {parsed.errors.length > 0
                                ? "Pakiet wymaga poprawy"
                                : "Wszystkie lekcje są gotowe do importu"}
                        </p>
                        {parsed.errors.slice(0, 8).map(error => (
                            <p key={error} className="mt-2 text-sm leading-6 text-red-200">{error}</p>
                        ))}
                        {parsed.warnings.slice(0, 8).map(warning => (
                            <p key={warning} className="mt-2 text-sm leading-6 text-amber-200">{warning}</p>
                        ))}
                    </div>

                    {parsed.lessons.length > 0 && (
                        <ol className="grid gap-2 sm:grid-cols-2">
                            {parsed.lessons.map((lesson, index) => (
                                <li key={`${lesson.number}-${lesson.title}-${index}`} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                                    <p className="text-xs font-black uppercase tracking-wider text-violet-300">
                                        Lekcja {lesson.number} · {lesson.blocks.length} {lesson.blocks.length === 1 ? "blok" : "bloków"}
                                    </p>
                                    <p className="mt-1 font-bold text-slate-200">{lesson.title || "Brak tytułu"}</p>
                                </li>
                            ))}
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
                    <p className="font-black">Importowanie lekcji {progress.current} z {progress.total}</p>
                    <p className="mt-1 text-blue-200/80">{progress.title}</p>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/30">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-400 transition-all"
                            style={{ width: `${Math.round(progress.current / progress.total * 100)}%` }}
                        />
                    </div>
                </div>
            )}

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
                    ? "Importowanie całego etapu..."
                    : `Importuj ${parsed.lessonCount || 0} kompletnych lekcji`}
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

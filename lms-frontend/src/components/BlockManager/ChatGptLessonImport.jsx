import { useMemo, useState } from "react";
import {
    BsCheckCircle,
    BsClipboard,
    BsCloudArrowUp,
    BsExclamationTriangle,
    BsStars,
    BsX
} from "react-icons/bs";
import { useFeedback } from "../../context/FeedbackContext";
import {
    CHAT_GPT_LESSON_PROMPT,
    parseChatGptLesson
} from "../../utils/chatGptLessonImport";
import { getBlockLabel } from "./blockTypes";

export default function ChatGptLessonImport({ lessonId, lessonBlocks }) {
    const { showToast } = useFeedback();
    const [open, setOpen] = useState(false);
    const [source, setSource] = useState("");
    const result = useMemo(() => parseChatGptLesson(source), [source]);
    const importing = Boolean(lessonBlocks.importingByLesson?.[lessonId]);

    const copyPrompt = async () => {
        try {
            await navigator.clipboard.writeText(CHAT_GPT_LESSON_PROMPT);
            showToast("Wzór promptu został skopiowany.", "success");
        } catch {
            showToast("Nie udało się skopiować promptu.", "error");
        }
    };

    const importLesson = async () => {
        const imported = await lessonBlocks.importBlocks(lessonId, result.blocks);
        if (imported) {
            setSource("");
            setOpen(false);
        }
    };

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-violet-400/25 bg-violet-500/10 px-5 py-4 font-black text-violet-100 transition hover:border-violet-300/50 hover:bg-violet-500/15"
            >
                <BsStars />
                Importuj lekcję z ChatGPT
            </button>
        );
    }

    return (
        <section className="rounded-3xl border border-violet-400/25 bg-violet-500/[0.07] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-300">Import bez API</p>
                    <h4 className="mt-2 text-xl font-black text-white">Wklej lekcję przygotowaną w ChatGPT</h4>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                        EduHub rozpozna kroki, typy bloków, treści i odpowiedzi quizów. Nic nie zostanie zapisane przed kliknięciem importu.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Zamknij importer"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 text-slate-400 transition hover:bg-white/5 hover:text-white"
                >
                    <BsX />
                </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={copyPrompt}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:border-violet-300/30 hover:bg-white/5"
                >
                    <BsClipboard /> Skopiuj wzór promptu
                </button>
            </div>

            <label className="mt-5 block">
                <span className="sr-only">Treść lekcji z ChatGPT</span>
                <textarea
                    value={source}
                    onChange={(event) => setSource(event.target.value)}
                    rows={14}
                    placeholder="Wklej tutaj tekst rozpoczynający się od KROK 1..."
                    className="w-full resize-y rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-4 font-mono text-sm leading-6 text-slate-200 outline-none transition placeholder:text-slate-600 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
                />
            </label>

            {source.trim() && (
                <div className="mt-5 space-y-4">
                    <div className={`rounded-2xl border p-4 ${
                        result.errors.length > 0
                            ? "border-red-400/25 bg-red-500/10"
                            : "border-emerald-400/25 bg-emerald-500/10"
                    }`}>
                        <div className="flex items-center gap-2 font-black text-white">
                            {result.errors.length > 0
                                ? <BsExclamationTriangle className="text-red-300" />
                                : <BsCheckCircle className="text-emerald-300" />}
                            Wykryto {result.blocks.length} {result.blocks.length === 1 ? "blok" : "bloków"}
                        </div>
                        {result.errors.map((error) => (
                            <p key={error} className="mt-2 text-sm text-red-200">{error}</p>
                        ))}
                        {result.warnings.map((warning) => (
                            <p key={warning} className="mt-2 text-sm text-amber-200">{warning}</p>
                        ))}
                    </div>

                    {result.blocks.length > 0 && (
                        <ol className="grid gap-2 sm:grid-cols-2">
                            {result.blocks.map((block, index) => (
                                <li key={`${index}-${block.title}`} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                                    <span className="text-xs font-black uppercase tracking-wider text-violet-300">
                                        {index + 1}. {getBlockLabel(block.type)}
                                    </span>
                                    <p className="mt-1 truncate text-sm font-bold text-slate-200">{block.title || "Separator"}</p>
                                </li>
                            ))}
                        </ol>
                    )}

                    <button
                        type="button"
                        disabled={importing || result.blocks.length === 0 || result.errors.length > 0}
                        onClick={importLesson}
                        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-500 to-blue-600 px-5 py-4 font-black text-white shadow-lg shadow-violet-500/15 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {importing
                            ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            : <BsCloudArrowUp />}
                        {importing ? "Importowanie..." : `Dodaj ${result.blocks.length} bloków do lekcji`}
                    </button>
                </div>
            )}
        </section>
    );
}

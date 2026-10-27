import { useState } from "react";
import { BsChevronDown, BsPencil, BsPlusCircle, BsTrash } from "react-icons/bs";

export default function CourseSectionHeading({
    title, moduleName, stageNumber, canEdit, onSave,
    expanded, onToggle, panelId, summary, fallbackTitle = "Etapy kursu", appearance = "dark"
}) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const inputId = `section-title-${stageNumber}`;
    const light = appearance === "light";

    const startEditing = () => {
        setDraft(title || "");
        setError("");
        setEditing(true);
    };

    const save = async (value) => {
        setSaving(true);
        setError("");
        try {
            await onSave(value);
            setEditing(false);
        } catch (saveError) {
            setError(saveError.message || "Nie udało się zapisać nagłówka. Spróbuj ponownie.");
        } finally {
            setSaving(false);
        }
    };

    if (canEdit && editing) {
        return (
            <form
                onSubmit={event => {
                    event.preventDefault();
                    if (!saving && draft.trim()) save(draft.trim());
                }}
                aria-busy={saving}
                className={`mb-4 rounded-2xl border p-4 sm:p-5 ${light ? "border-slate-200 bg-white" : "border-violet-400/30 bg-violet-500/[0.06]"}`}
            >
                <label htmlFor={inputId} className={`font-bold ${light ? "text-slate-900" : "text-violet-100"}`}>
                    Nagłówek przed etapem {stageNumber}
                </label>
                <p className={`mt-1 text-sm ${light ? "text-slate-600" : "text-gray-400"}`}>{moduleName}</p>
                <input
                    id={inputId}
                    value={draft}
                    onChange={event => setDraft(event.target.value)}
                    maxLength={200}
                    placeholder="Np. CZĘŚĆ II — Praca z bazami danych"
                    autoFocus
                    disabled={saving}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${inputId}-error` : undefined}
                    className={`mt-3 w-full rounded-xl border px-4 py-3 font-bold outline-none disabled:opacity-60 ${light ? "border-slate-300 bg-white text-slate-900 caret-teal-800 placeholder:text-slate-500 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15" : "border-violet-400/20 bg-gray-950 text-white focus:border-violet-400"}`}
                />
                {error && (
                    <p id={`${inputId}-error`} role="alert" className={`mt-3 text-sm ${light ? "text-red-700" : "text-red-300"}`}>{error}</p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                        type="submit"
                        disabled={saving || !draft.trim()}
                        className={`rounded-xl px-4 py-2 text-sm font-bold text-white transition disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 ${light ? "bg-teal-800 hover:bg-teal-900 focus-visible:outline-teal-700" : "bg-violet-600 hover:bg-violet-500 focus-visible:outline-violet-300"}`}
                    >
                        {saving ? "Zapisywanie…" : "Zapisz nagłówek"}
                    </button>
                    <button
                        type="button"
                        onClick={() => setEditing(false)}
                        disabled={saving}
                        className={`rounded-xl border px-4 py-2 text-sm font-bold transition disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 ${light ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-teal-700" : "border-white/10 text-gray-300 hover:bg-white/5 focus-visible:outline-violet-300"}`}
                    >
                        Anuluj
                    </button>
                    {title && (
                        <button
                            type="button"
                            onClick={() => save(null)}
                            disabled={saving}
                            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold transition disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 sm:ml-auto ${light ? "text-red-700 hover:bg-red-50 focus-visible:outline-red-700" : "text-red-300 hover:bg-red-500/10 focus-visible:outline-red-300"}`}
                        >
                            <BsTrash aria-hidden="true" /> Usuń nagłówek
                        </button>
                    )}
                </div>
            </form>
        );
    }

    if (!title && !onToggle) {
        return canEdit ? (
            <div className="mb-2 flex justify-end px-2">
                <button
                    type="button"
                    onClick={startEditing}
                    aria-label={`Dodaj nagłówek przed etapem ${stageNumber}: ${moduleName}`}
                    className={`inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 ${light ? "text-teal-800 hover:bg-teal-50 focus-visible:outline-teal-700" : "text-violet-300 hover:bg-violet-500/10 focus-visible:outline-violet-300"}`}
                >
                    <BsPlusCircle aria-hidden="true" /> Dodaj nagłówek
                </button>
            </div>
        ) : null;
    }

    return (
        <header className={`relative mb-5 overflow-hidden rounded-[28px] border p-6 sm:p-8 ${light ? "border-slate-200 bg-[#f1f3ed]" : "border-violet-400/25 bg-gradient-to-br from-violet-500/15 via-blue-500/10 to-cyan-400/[0.06]"}`}>
            {!light && <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-violet-500/15 blur-3xl" />}
            <div className="relative flex flex-wrap items-center justify-between gap-3">
                <p className={`text-[11px] font-black uppercase tracking-[0.28em] ${light ? "text-teal-800" : "text-violet-300"}`}>
                    {title ? "Część kursu" : "Etapy kursu"}
                </p>
                {canEdit && (
                    <button
                        type="button"
                        onClick={startEditing}
                        aria-label={title
                            ? `Edytuj nagłówek przed etapem ${stageNumber}: ${title}`
                            : `Dodaj nagłówek przed etapem ${stageNumber}: ${moduleName}`}
                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 ${light ? "border-slate-300 bg-white text-teal-800 hover:bg-teal-50 focus-visible:outline-teal-700" : "border-violet-400/20 text-violet-200 hover:bg-violet-500/15 focus-visible:outline-violet-300"}`}
                    >
                        {title ? <BsPencil aria-hidden="true" /> : <BsPlusCircle aria-hidden="true" />}
                        {title ? "Edytuj nagłówek" : "Dodaj nagłówek"}
                    </button>
                )}
            </div>
            <h2 className={`relative mt-3 break-words text-2xl font-black leading-tight sm:text-3xl ${light ? "text-slate-900" : "text-white"}`}>
                {onToggle ? (
                    <button
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={panelId}
                        aria-label={`${expanded ? "Zwiń" : "Rozwiń"} część ${title || fallbackTitle}`}
                        onClick={onToggle}
                        className={`flex w-full items-start justify-between gap-4 rounded-xl text-left transition focus-visible:outline-2 focus-visible:outline-offset-4 ${light ? "hover:text-teal-800 focus-visible:outline-teal-700" : "hover:text-cyan-200 focus-visible:outline-cyan-300"}`}
                    >
                        <span className="min-w-0">{title || fallbackTitle}</span>
                        <span className={`mt-1 flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 ${light ? "border-slate-300 bg-white text-teal-800" : "border-violet-300/20 bg-white/[0.04] text-violet-200"}`}>
                            <span className="hidden text-xs font-bold sm:inline">{expanded ? "Zwiń" : "Rozwiń"}</span>
                            <BsChevronDown aria-hidden="true" className={`text-base transition-transform duration-200 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`} />
                        </span>
                    </button>
                ) : title}
            </h2>
            {summary && <p className={`relative mt-3 text-sm font-bold ${light ? "text-slate-600" : "text-violet-200/70"}`}>{summary}</p>}
        </header>
    );
}

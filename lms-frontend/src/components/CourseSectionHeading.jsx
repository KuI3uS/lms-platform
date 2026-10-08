import { useState } from "react";
import { BsPencil, BsPlusCircle, BsTrash } from "react-icons/bs";

export default function CourseSectionHeading({ title, moduleName, stageNumber, canEdit, onSave }) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const inputId = `section-title-${stageNumber}`;

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
                className="mb-4 rounded-2xl border border-violet-400/30 bg-violet-500/[0.06] p-4 sm:p-5"
            >
                <label htmlFor={inputId} className="font-bold text-violet-100">
                    Nagłówek przed etapem {stageNumber}
                </label>
                <p className="mt-1 text-sm text-gray-400">{moduleName}</p>
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
                    className="mt-3 w-full rounded-xl border border-violet-400/20 bg-gray-950 px-4 py-3 font-bold text-white outline-none focus:border-violet-400 disabled:opacity-60"
                />
                {error && (
                    <p id={`${inputId}-error`} role="alert" className="mt-3 text-sm text-red-300">{error}</p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                        type="submit"
                        disabled={saving || !draft.trim()}
                        className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-bold transition hover:bg-violet-500 disabled:opacity-40"
                    >
                        {saving ? "Zapisywanie…" : "Zapisz nagłówek"}
                    </button>
                    <button
                        type="button"
                        onClick={() => setEditing(false)}
                        disabled={saving}
                        className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-gray-300 transition hover:bg-white/5 disabled:opacity-40"
                    >
                        Anuluj
                    </button>
                    {title && (
                        <button
                            type="button"
                            onClick={() => save(null)}
                            disabled={saving}
                            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-red-300 transition hover:bg-red-500/10 disabled:opacity-40 sm:ml-auto"
                        >
                            <BsTrash aria-hidden="true" /> Usuń nagłówek
                        </button>
                    )}
                </div>
            </form>
        );
    }

    if (!title) {
        return canEdit ? (
            <div className="mb-2 flex justify-end px-2">
                <button
                    type="button"
                    onClick={startEditing}
                    aria-label={`Dodaj nagłówek przed etapem ${stageNumber}: ${moduleName}`}
                    className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-bold text-violet-300 transition hover:bg-violet-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
                >
                    <BsPlusCircle aria-hidden="true" /> Dodaj nagłówek
                </button>
            </div>
        ) : null;
    }

    return (
        <header className="relative mb-5 overflow-hidden rounded-[28px] border border-violet-400/25 bg-gradient-to-br from-violet-500/15 via-blue-500/10 to-cyan-400/[0.06] p-6 sm:p-8">
            <div className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-violet-500/15 blur-3xl" />
            <div className="relative flex flex-wrap items-center justify-between gap-3">
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-violet-300">
                    Nowa część kursu
                </p>
                {canEdit && (
                    <button
                        type="button"
                        onClick={startEditing}
                        aria-label={`Edytuj nagłówek przed etapem ${stageNumber}: ${title}`}
                        className="inline-flex items-center gap-2 rounded-lg border border-violet-400/20 px-3 py-2 text-xs font-bold text-violet-200 transition hover:bg-violet-500/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
                    >
                        <BsPencil aria-hidden="true" /> Edytuj nagłówek
                    </button>
                )}
            </div>
            <h2 className="relative mt-3 break-words text-2xl font-black leading-tight text-white sm:text-3xl">
                {title}
            </h2>
        </header>
    );
}

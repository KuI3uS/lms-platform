import { useState } from "react";
import { BsFiles, BsSearch, BsTrash, BsX } from "react-icons/bs";
import { apiFetch } from "../api/api";
import { useFeedback } from "../context/FeedbackContext";

export default function CourseDuplicateCleanup({ courseId, onCleaned }) {
    const { confirm, showToast } = useFeedback();
    const [preview, setPreview] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [cleaned, setCleaned] = useState(null);

    const search = async () => {
        if (busy) return;
        setBusy(true);
        setError("");
        setCleaned(null);
        try {
            setPreview(await apiFetch(`/courses/${courseId}/duplicates`));
        } catch (searchError) {
            setError(searchError.message || "Nie udało się sprawdzić duplikatów.");
        } finally {
            setBusy(false);
        }
    };

    const cleanup = async () => {
        if (busy || !preview) return;
        // Keep the operation locked while the confirmation is open too.
        setBusy(true);
        try {
            if (!await confirm({
                title: "Usuń sprawdzone duplikaty",
                message: `Trwale usunąć wskazane duplikaty? Etapy do usunięcia: ${preview.modulesToDelete}. Lekcje łącznie: ${preview.lessonsToDelete} (w tym lekcje z usuwanych etapów). Zachowamy kopię każdego materiału i wpisy z aktywnością uczniów. Tej operacji nie można cofnąć.`,
                confirmLabel: "Usuń duplikaty"
            })) return;
            setError("");
            const result = await apiFetch(`/courses/${courseId}/duplicates/cleanup`, {
                method: "POST",
                body: JSON.stringify({ version: preview.version })
            });
            setPreview(null);
            setCleaned(result);
            showToast(`Usunięte etapy: ${result.modulesToDelete}. Usunięte lekcje: ${result.lessonsToDelete}.`, "success");
            try {
                await onCleaned?.();
            } catch {
                setError("Duplikaty zostały usunięte. Odśwież stronę, aby zobaczyć aktualną listę.");
            }
        } catch (cleanupError) {
            setPreview(null);
            setError(cleanupError.message || "Nie udało się usunąć duplikatów. Wyszukaj je ponownie.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <section className="rounded-2xl border border-amber-400/20 bg-amber-500/[0.04] p-4 sm:p-5" aria-busy={busy}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="inline-flex items-center gap-2 font-black text-amber-100"><BsFiles aria-hidden="true" /> Powtórzone etapy i lekcje</h2>
                    <p className="mt-1 text-xs leading-5 text-gray-400">Sprawdź kopie w całym kursie przed ich zbiorczym usunięciem.</p>
                </div>
                <button
                    type="button"
                    onClick={search}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-400/25 px-4 py-2.5 text-sm font-bold text-amber-200 transition hover:bg-amber-500/10 disabled:opacity-50"
                >
                    <BsSearch aria-hidden="true" /> {busy ? "Proszę czekać…" : "Znajdź duplikaty"}
                </button>
            </div>
            {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
            {cleaned && (
                <p role="status" className="mt-4 text-sm text-emerald-200">
                    Kurs został uporządkowany. Usunięte etapy: {cleaned.modulesToDelete}. Usunięte lekcje: {cleaned.lessonsToDelete}.
                </p>
            )}
            {preview && (
                <div className="mt-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="font-bold text-white">
                                Do usunięcia — etapy: {preview.modulesToDelete}, lekcje łącznie: {preview.lessonsToDelete}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-gray-400">
                                Porównujemy nazwy, treść, bloki ćwiczeń i ustawienia. Lekcje sprawdzamy w obrębie etapu, a etapy w całym kursie. Zachowujemy jedną kopię oraz wszystkie wpisy z aktywnością uczniów.
                            </p>
                            {preview.protectedCopies > 0 && (
                                <p className="mt-2 text-sm text-amber-200">Chronione kopie: {preview.protectedCopies}. Zawierają aktywność uczniów lub pytania egzaminacyjne.</p>
                            )}
                        </div>
                        <button type="button" disabled={busy} onClick={() => setPreview(null)} aria-label="Zamknij podgląd duplikatów" className="rounded-lg p-2 text-gray-400 hover:bg-white/5"><BsX /></button>
                    </div>
                    {preview.groups.length > 0 ? (
                        <details className="rounded-xl border border-white/10 bg-black/20 p-3">
                            <summary className="cursor-pointer text-sm font-bold text-gray-200">Pokaż znalezione kopie — grupy: {preview.groups.length}</summary>
                            <ul className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-2 text-sm">
                                {preview.groups.map(group => (
                                    <li key={`${group.kind}:${group.keptId}`} className="rounded-lg bg-white/[0.03] p-3">
                                        <p className="font-bold text-white">{group.kind === "MODULE" ? "Etap" : "Lekcja w etapie"} {group.stageNumber}: {group.title}</p>
                                        <p className="mt-1 text-xs text-gray-400">Kopie do usunięcia: {group.duplicateIds.length}.{group.protectedCopies > 0 ? ` Chronione kopie: ${group.protectedCopies}.` : ""}</p>
                                    </li>
                                ))}
                            </ul>
                        </details>
                    ) : <p role="status" className="text-sm text-emerald-200">Nie znaleziono identycznych duplikatów.</p>}
                    {(preview.modulesToDelete > 0 || preview.lessonsToDelete > 0) && (
                        <button
                            type="button"
                            onClick={cleanup}
                            disabled={busy}
                            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-500 disabled:opacity-50"
                        >
                            <BsTrash aria-hidden="true" /> {busy ? "Usuwanie…" : "Usuń duplikaty z podglądu"}
                        </button>
                    )}
                </div>
            )}
        </section>
    );
}

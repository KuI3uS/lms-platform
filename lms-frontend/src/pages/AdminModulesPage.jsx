import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    BsBook,
    BsCheck2,
    BsCloudDownload,
    BsGear,
    BsPlusCircle,
    BsStars,
    BsTrash
} from "react-icons/bs";
import { apiFetch } from "../api/api";

export default function AdminModulesPage() {
    const [courses, setCourses] = useState([]);
    const [courseId, setCourseId] = useState("");
    const [modules, setModules] = useState([]);
    const [newModuleName, setNewModuleName] = useState("");
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [importPlan, setImportPlan] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        apiFetch("/courses")
            .then((data) => {
                if (!active) return;
                const list = data || [];
                setCourses(list);
                if (list.length > 0) {
                    setLoading(true);
                    setCourseId(String(list[0].id));
                }
            })
            .catch((loadError) => {
                if (active) setError(loadError.message || "Nie udało się pobrać kursów.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!courseId) {
            return undefined;
        }

        let active = true;
        apiFetch(`/modules/course/${courseId}`)
            .then((data) => {
                if (active) setModules(data || []);
            })
            .catch((loadError) => {
                if (active) setError(loadError.message || "Nie udało się pobrać modułów.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [courseId]);

    useEffect(() => {
        if (!courseId) {
            return undefined;
        }

        let active = true;
        apiFetch(`/admin/curricula/java-junior/course/${courseId}/preview`)
            .then((data) => {
                if (active) setImportPlan(data);
            })
            .catch((loadError) => {
                if (active) {
                    setImportPlan(null);
                    setError(loadError.message || "Nie udało się przygotować podglądu importu.");
                }
            });
        return () => {
            active = false;
        };
    }, [courseId]);

    const updateLocal = (moduleId, changes) => {
        setModules((current) => current.map((module) =>
            module.id === moduleId ? { ...module, ...changes } : module
        ));
    };

    const addModule = async (event) => {
        event.preventDefault();
        if (!newModuleName.trim() || !courseId) return;

        try {
            setError("");
            const created = await apiFetch(`/modules/course/${courseId}`, {
                method: "POST",
                body: JSON.stringify({
                    name: newModuleName.trim(),
                    lessonsLocked: true
                })
            });
            setModules((current) => [...current, created]);
            setNewModuleName("");
        } catch (saveError) {
            setError(saveError.message || "Nie udało się dodać modułu.");
        }
    };

    const saveModule = async (module) => {
        try {
            setSavingId(module.id);
            setError("");
            const saved = await apiFetch(`/modules/${module.id}`, {
                method: "PUT",
                body: JSON.stringify({
                    name: module.name.trim(),
                    lessonsLocked: module.lessonsLocked
                })
            });
            updateLocal(module.id, saved);
        } catch (saveError) {
            setError(saveError.message || "Nie udało się zapisać modułu.");
        } finally {
            setSavingId(null);
        }
    };

    const deleteModule = async (module) => {
        if (!window.confirm(`Usunąć moduł „${module.name}”?`)) return;
        try {
            setError("");
            await apiFetch(`/modules/${module.id}`, { method: "DELETE" });
            setModules((current) => current.filter((item) => item.id !== module.id));
        } catch (deleteError) {
            setError(deleteError.message || "Nie udało się usunąć modułu.");
        }
    };

    const importCurriculum = async () => {
        if (!courseId || !importPlan || importPlan.readyModules === 0) return;

        const confirmed = window.confirm(
            `Uzupełnić ${importPlan.readyModules} pustych modułów?\n\n`
            + `Powstanie ${importPlan.lessons} lekcji i ${importPlan.blocks} bloków. `
            + "Moduły, które mają już lekcje, zostaną pominięte."
        );
        if (!confirmed) return;

        try {
            setImporting(true);
            setError("");
            setImportResult(null);
            const result = await apiFetch(
                `/admin/curricula/java-junior/course/${courseId}/import`,
                { method: "POST" }
            );
            setImportResult(result);
            const nextPlan = await apiFetch(
                `/admin/curricula/java-junior/course/${courseId}/preview`
            );
            setImportPlan(nextPlan);
        } catch (importError) {
            setError(importError.message || "Nie udało się zaimportować programu kursu.");
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="mx-auto max-w-6xl space-y-8 text-white">
            <header className="rounded-[34px] border border-emerald-500/20 bg-gradient-to-br from-emerald-950/80 to-slate-950 p-7 sm:p-10">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-300">EduHub Creator</p>
                <h1 className="mt-3 text-4xl font-black sm:text-5xl">Moduły kursów</h1>
                <p className="mt-4 max-w-3xl text-slate-400">
                    Wybierz kurs, uporządkuj jego moduły i przejdź bezpośrednio do edycji lekcji.
                </p>
            </header>

            {error && (
                <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
                    {error}
                </div>
            )}

            <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
                <label className="flex items-center gap-2 font-bold text-slate-300">
                    <BsBook /> Kurs
                </label>
                <select
                    value={courseId}
                    onChange={(event) => {
                        setLoading(true);
                        setError("");
                        setModules([]);
                        setCourseId(event.target.value);
                    }}
                    className="mt-3 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-400"
                >
                    {courses.length === 0 && <option value="">Brak kursów</option>}
                    {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                            {course.title || course.name}
                        </option>
                    ))}
                </select>

                <form onSubmit={addModule} className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <input
                        value={newModuleName}
                        onChange={(event) => setNewModuleName(event.target.value)}
                        placeholder="Nazwa nowego modułu"
                        className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-400"
                    />
                    <button
                        type="submit"
                        disabled={!courseId || !newModuleName.trim()}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-black disabled:opacity-40"
                    >
                        <BsPlusCircle /> Dodaj moduł
                    </button>
                </form>
            </section>

            {importPlan && (
                <section className="overflow-hidden rounded-3xl border border-cyan-400/25 bg-gradient-to-br from-cyan-500/10 via-slate-950 to-blue-500/10">
                    <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1fr_auto] lg:items-center">
                        <div>
                            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
                                <BsStars /> Gotowy program kursu
                            </p>
                            <h2 className="mt-2 text-2xl font-black">
                                {importPlan.curriculum}
                                <span className="ml-2 text-sm text-slate-500">v{importPlan.version}</span>
                            </h2>
                            <p className="mt-3 max-w-3xl leading-7 text-slate-400">
                                Bezpieczny import uzupełnia tylko puste, ponumerowane etapy.
                                Każdy etap otrzyma lekcję teorii i laboratorium z przykładem,
                                zadaniem, quizem, wskazówkami oraz podsumowaniem.
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2 text-sm font-bold">
                                <span className="rounded-full bg-white/5 px-3 py-1.5 text-slate-300">
                                    {importPlan.readyModules} modułów do uzupełnienia
                                </span>
                                <span className="rounded-full bg-white/5 px-3 py-1.5 text-slate-300">
                                    {importPlan.lessons} lekcji
                                </span>
                                <span className="rounded-full bg-white/5 px-3 py-1.5 text-slate-300">
                                    {importPlan.blocks} bloków
                                </span>
                                {importPlan.skippedNonEmptyModules > 0 && (
                                    <span className="rounded-full bg-amber-500/10 px-3 py-1.5 text-amber-200">
                                        {importPlan.skippedNonEmptyModules} z treścią — bez zmian
                                    </span>
                                )}
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={importCurriculum}
                            disabled={importing || importPlan.readyModules === 0}
                            className="inline-flex min-w-52 items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 py-4 font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
                        >
                            <BsCloudDownload />
                            {importing
                                ? "Tworzę materiały..."
                                : importPlan.readyModules > 0
                                    ? "Uzupełnij kurs"
                                    : "Kurs jest uzupełniony"}
                        </button>
                    </div>
                    {importPlan.warnings?.length > 0 && (
                        <div className="border-t border-amber-400/15 bg-amber-500/[0.06] px-5 py-4 text-sm text-amber-100 sm:px-7">
                            {importPlan.warnings.join(" ")}
                        </div>
                    )}
                </section>
            )}

            {importResult && (
                <div role="status" className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-5 text-emerald-100">
                    Gotowe — utworzono {importResult.lessons} lekcji i {importResult.blocks} bloków
                    w {importResult.readyModules} modułach. Istniejące materiały pozostały bez zmian.
                </div>
            )}

            {loading ? (
                <div className="grid min-h-52 place-items-center">
                    <span className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" />
                </div>
            ) : modules.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/15 p-10 text-center text-slate-500">
                    Ten kurs nie ma jeszcze modułów.
                </div>
            ) : (
                <section className="grid gap-4">
                    {modules.map((module, index) => (
                        <article
                            key={module.id}
                            className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6"
                        >
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
                                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-500/15 font-black text-emerald-300">
                                    {index + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <input
                                        value={module.name}
                                        onChange={(event) => updateLocal(module.id, { name: event.target.value })}
                                        className="w-full rounded-xl border border-transparent bg-slate-950/70 px-4 py-3 text-lg font-black outline-none focus:border-emerald-400"
                                    />
                                    <label className="mt-3 flex items-center gap-3 text-sm text-slate-400">
                                        <input
                                            type="checkbox"
                                            checked={module.lessonsLocked}
                                            onChange={(event) => updateLocal(module.id, {
                                                lessonsLocked: event.target.checked
                                            })}
                                            className="accent-emerald-500"
                                        />
                                        Odblokowuj lekcje kolejno
                                    </label>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => saveModule(module)}
                                        disabled={savingId === module.id || !module.name.trim()}
                                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600/20 px-4 py-3 font-bold text-emerald-300 hover:bg-emerald-600 hover:text-white disabled:opacity-40"
                                    >
                                        <BsCheck2 /> {savingId === module.id ? "Zapis..." : "Zapisz"}
                                    </button>
                                    <Link
                                        to={`/admin/lessons/${module.id}`}
                                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600/20 px-4 py-3 font-bold text-blue-300 hover:bg-blue-600 hover:text-white"
                                    >
                                        <BsGear /> Lekcje
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => deleteModule(module)}
                                        className="inline-flex items-center gap-2 rounded-xl bg-red-600/15 px-4 py-3 font-bold text-red-300 hover:bg-red-600 hover:text-white"
                                    >
                                        <BsTrash /> Usuń
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </section>
            )}
        </div>
    );
}

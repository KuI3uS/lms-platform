import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    BsBook,
    BsCheck2,
    BsGear,
    BsPlusCircle,
    BsTrash
} from "react-icons/bs";
import { apiFetch } from "../api/api";
import { useFeedback } from "../context/FeedbackContext";

export default function AdminModulesPage() {
    const { confirm } = useFeedback();
    const [courses, setCourses] = useState([]);
    const [courseId, setCourseId] = useState("");
    const [modules, setModules] = useState([]);
    const [newModuleName, setNewModuleName] = useState("");
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [error, setError] = useState("");
    const selectedCourse = courses.find((course) => String(course.id) === String(courseId));
    const isLanguageCourse = selectedCourse?.category === "LANGUAGE";

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
        if (!await confirm({ title: "Usuń moduł", message: `Usunąć moduł „${module.name}” razem z jego lekcjami?`, confirmLabel: "Usuń moduł" })) return;
        try {
            setError("");
            await apiFetch(`/modules/${module.id}`, { method: "DELETE" });
            setModules((current) => current.filter((item) => item.id !== module.id));
        } catch (deleteError) {
            setError(deleteError.message || "Nie udało się usunąć modułu.");
        }
    };

    return (
        <div className="mx-auto max-w-6xl space-y-8 text-white">
            <header className="rounded-[34px] border border-emerald-500/20 bg-gradient-to-br from-emerald-950/80 to-slate-950 p-7 sm:p-10">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-300">
                    {isLanguageCourse ? "EduHub Languages" : "EduHub Creator"}
                </p>
                <h1 className="mt-3 text-4xl font-black sm:text-5xl">
                    {isLanguageCourse ? "Rozdziały kursu językowego" : "Moduły kursów"}
                </h1>
                <p className="mt-4 max-w-3xl text-slate-400">
                    {isLanguageCourse
                        ? "Podziel kurs na proste sytuacje komunikacyjne, np. poznawanie ludzi, podróż albo praca."
                        : "Wybierz kurs, uporządkuj jego moduły i przejdź bezpośrednio do edycji lekcji."}
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
                        placeholder={isLanguageCourse ? "Nazwa rozdziału, np. W restauracji" : "Nazwa nowego modułu"}
                        className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-emerald-400"
                    />
                    <button
                        type="submit"
                        disabled={!courseId || !newModuleName.trim()}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-black disabled:opacity-40"
                    >
                        <BsPlusCircle /> {isLanguageCourse ? "Dodaj rozdział" : "Dodaj moduł"}
                    </button>
                </form>
            </section>

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
                                        {isLanguageCourse ? "Prowadź ucznia krok po kroku" : "Odblokowuj lekcje kolejno"}
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

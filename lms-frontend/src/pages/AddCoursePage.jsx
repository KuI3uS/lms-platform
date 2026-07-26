import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    BsArrowLeft,
    BsBookHalf,
    BsCheckCircle,
    BsCollection,
    BsSave
} from "react-icons/bs";
import { apiFetch } from "../api/api";
import {
    getCourseCover,
    getGeneratedCourseCover
} from "../utils/courseCover";

const EMPTY_COURSE = {
    name: "",
    title: "",
    description: "",
    level: "Podstawy",
    price: "0",
    paymentUrl: "",
    thumbnailUrl: "",
    published: true
};

const fieldClass = "w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3.5 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/10";

function getErrorMessage(error) {
    try {
        const response = JSON.parse(error.message);
        return response.detail || response.message || response.error || "Nie udało się zapisać kursu.";
    } catch {
        return error.message || "Nie udało się zapisać kursu.";
    }
}

export default function AddCoursePage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(courseId);

    const [course, setCourse] = useState(EMPTY_COURSE);
    const [loadingCourse, setLoadingCourse] = useState(isEditing);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!courseId) return undefined;

        let active = true;

        async function loadCourse() {
            try {
                setLoadingCourse(true);
                setError("");
                const data = await apiFetch(`/courses/${courseId}`);

                if (active) {
                    setCourse({
                        name: data.name || "",
                        title: data.title || "",
                        description: data.description || "",
                        level: data.level || "Podstawy",
                        price: data.price ?? "0",
                        paymentUrl: data.paymentUrl || "",
                        thumbnailUrl: data.thumbnailUrl || "",
                        published: Boolean(data.published)
                    });
                }
            } catch (loadError) {
                if (active) setError(getErrorMessage(loadError));
            } finally {
                if (active) setLoadingCourse(false);
            }
        }

        loadCourse();

        return () => {
            active = false;
        };
    }, [courseId]);

    const updateField = (event) => {
        const { name, value, type, checked } = event.target;
        setCourse((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const submit = async (event) => {
        event.preventDefault();

        if (!course.name.trim()) {
            setError("Podaj nazwę kursu.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            await apiFetch(isEditing ? `/courses/${courseId}` : "/courses", {
                method: isEditing ? "PUT" : "POST",
                body: JSON.stringify({
                    ...course,
                    price: Number(course.price || 0)
                })
            });

            navigate("/courses", {
                replace: true,
                state: {
                    message: isEditing
                        ? "Zmiany w kursie zostały zapisane."
                        : "Kurs został utworzony."
                }
            });
        } catch (saveError) {
            setError(getErrorMessage(saveError));
        } finally {
            setSaving(false);
        }
    };

    if (loadingCourse) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-6xl">
            <button
                type="button"
                onClick={() => navigate("/courses")}
                className="mb-6 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-400 transition hover:bg-white/5 hover:text-white"
            >
                <BsArrowLeft />
                Wróć do kursów
            </button>

            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
                <header className="border-b border-white/10 p-6 sm:p-8">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
                            <BsCollection size={30} />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                                EduHub Creator
                            </p>
                            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                                {isEditing ? "Edytuj kurs" : "Nowy kurs"}
                            </h1>
                            <p className="mt-2 max-w-2xl text-slate-400">
                                Uzupełnij informacje widoczne dla uczniów. Moduły i lekcje dodasz po zapisaniu kursu.
                            </p>
                        </div>
                    </div>
                </header>

                <form onSubmit={submit} className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-6">
                        {error && (
                            <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
                                {error}
                            </div>
                        )}

                        <div className="grid gap-5 sm:grid-cols-2">
                            <label className="space-y-2">
                                <span className="flex items-center gap-2 text-sm font-bold text-slate-300">
                                    <BsBookHalf /> Nazwa kursu
                                </span>
                                <input
                                    name="name"
                                    value={course.name}
                                    onChange={updateField}
                                    placeholder="np. INF.03"
                                    className={fieldClass}
                                    required
                                />
                            </label>

                            <label className="space-y-2">
                                <span className="text-sm font-bold text-slate-300">Tytuł wyświetlany</span>
                                <input
                                    name="title"
                                    value={course.title}
                                    onChange={updateField}
                                    placeholder="np. Tworzenie aplikacji webowych"
                                    className={fieldClass}
                                />
                            </label>
                        </div>

                        <label className="block space-y-2">
                            <span className="text-sm font-bold text-slate-300">Link do płatności za kurs</span>
                            <input
                                name="paymentUrl"
                                type="url"
                                value={course.paymentUrl}
                                onChange={updateField}
                                placeholder="https://checkout.revolut.com/pay/..."
                                className={fieldClass}
                            />
                            <span className="block text-xs leading-5 text-slate-500">
                                Wymagany tylko dla kursu płatnego. Po płatności administrator potwierdza zamówienie i odblokowuje dostęp.
                            </span>
                        </label>

                        <label className="block space-y-2">
                            <span className="text-sm font-bold text-slate-300">Opis</span>
                            <textarea
                                name="description"
                                value={course.description}
                                onChange={updateField}
                                placeholder="Krótko opisz, czego uczeń nauczy się w tym kursie."
                                rows={5}
                                className={`${fieldClass} resize-y`}
                            />
                        </label>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <label className="space-y-2">
                                <span className="text-sm font-bold text-slate-300">Poziom</span>
                                <select
                                    name="level"
                                    value={course.level}
                                    onChange={updateField}
                                    className={fieldClass}
                                >
                                    <option>Podstawy</option>
                                    <option>Średniozaawansowany</option>
                                    <option>Zaawansowany</option>
                                </select>
                            </label>

                            <label className="space-y-2">
                                <span className="text-sm font-bold text-slate-300">Cena (zł)</span>
                                <input
                                    name="price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={course.price}
                                    onChange={updateField}
                                    className={fieldClass}
                                />
                            </label>
                        </div>

                        <label className="block space-y-2">
                            <span className="text-sm font-bold text-slate-300">Adres własnej okładki (opcjonalnie)</span>
                            <input
                                name="thumbnailUrl"
                                type="url"
                                value={course.thumbnailUrl}
                                onChange={updateField}
                                placeholder="https://..."
                                className={fieldClass}
                            />
                            <span className="block text-xs leading-5 text-slate-500">
                                Bez adresu EduHub automatycznie dobierze przygotowaną okładkę na podstawie nazwy kursu.
                            </span>
                        </label>

                        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                            <input
                                name="published"
                                type="checkbox"
                                checked={course.published}
                                onChange={updateField}
                                className="mt-1 h-4 w-4 accent-cyan-500"
                            />
                            <span>
                                <span className="block font-bold">Opublikowany</span>
                                <span className="mt-1 block text-sm text-slate-500">
                                    Opublikowany kurs jest widoczny dla uczniów. Administrator zawsze widzi wszystkie kursy.
                                </span>
                            </span>
                        </label>
                    </div>

                    <aside className="space-y-5">
                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
                            <img
                                src={getCourseCover(course)}
                                alt="Podgląd okładki kursu"
                                onError={({ currentTarget }) => {
                                    currentTarget.onerror = null;
                                    currentTarget.src = getGeneratedCourseCover(course);
                                }}
                                className="aspect-[3/2] w-full object-cover"
                            />
                            <div className="p-5">
                                <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Podgląd</p>
                                <h2 className="mt-2 text-xl font-black">
                                    {course.title || course.name || "Nazwa kursu"}
                                </h2>
                                <p className="mt-2 text-sm text-slate-500">{course.level}</p>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-4 font-black shadow-lg shadow-blue-600/20 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60"
                        >
                            {saving ? (
                                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : isEditing ? (
                                <BsSave size={19} />
                            ) : (
                                <BsCheckCircle size={19} />
                            )}
                            {saving
                                ? "Zapisywanie..."
                                : isEditing
                                    ? "Zapisz zmiany"
                                    : "Utwórz kurs"}
                        </button>
                    </aside>
                </form>
            </section>
        </div>
    );
}

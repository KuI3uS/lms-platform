import { useLocale } from "../context/LocaleContext.jsx";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    BsArrowLeft,
    BsBookHalf,
    BsBuildings,
    BsCheckCircle,
    BsCodeSlash,
    BsCollection,
    BsLaptop,
    BsMortarboard,
    BsSave,
    BsTranslate
} from "react-icons/bs";
import { apiFetch } from "../api/api";
import {
    getCourseCover,
    getGeneratedCourseCover
} from "../utils/courseCover";
import { getDefaultCoursePaymentUrl } from "../utils/paymentLinks";
import { CONTENT_LANGUAGES, contentLanguageOf } from "../utils/courseContentLanguage";
import {
    CEFR_LEVELS,
    COURSE_CATEGORIES,
    COURSE_LANGUAGES,
    SCHOOL_LEVELS,
    UNIVERSITY_LEVELS,
    getCourseLanguageLabel
} from "../utils/courseTaxonomy";

const EMPTY_COURSE = {
    name: "",
    title: "",
    description: "",
    category: "PROGRAMMING",
    courseLanguage: "ENGLISH",
    cefrLevel: "A1",
    cefrEndLevel: "C2",
    level: "Podstawy",
    billingMode: "FREE",
    price: "0",
    monthlyPrice: "0",
    paymentUrl: "",
    monthlyPaymentUrl: "",
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
    const { t, language } = useLocale();
    const { courseId } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(courseId);

    const [course, setCourse] = useState(() => ({ ...EMPTY_COURSE, contentLanguage: language }));
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
                        category: data.category || "PROGRAMMING",
                        contentLanguage: contentLanguageOf(data),
                        courseLanguage: data.courseLanguage || "ENGLISH",
                        cefrLevel: data.cefrLevel || "A1",
                        cefrEndLevel: data.cefrEndLevel || data.cefrLevel || "A1",
                        level: data.level || "Podstawy",
                        price: data.price ?? "0",
                        billingMode: data.billingMode || (Number(data.price || 0) > 0 ? "ONE_TIME" : "FREE"),
                        monthlyPrice: data.monthlyPrice ?? "0",
                        paymentUrl: data.paymentUrl || getDefaultCoursePaymentUrl(data),
                        monthlyPaymentUrl: data.monthlyPaymentUrl || "",
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
        setCourse((current) => {
            const updated = {
                ...current,
                [name]: type === "checkbox" ? checked : value
            };
            if (name === "cefrLevel"
                    && CEFR_LEVELS.indexOf(updated.cefrEndLevel) < CEFR_LEVELS.indexOf(value)) {
                updated.cefrEndLevel = value;
            }
            if (name === "category") {
                if (value === "SCHOOL" && !SCHOOL_LEVELS.includes(updated.level)) {
                    updated.level = SCHOOL_LEVELS[0];
                } else if (value === "UNIVERSITY" && !UNIVERSITY_LEVELS.includes(updated.level)) {
                    updated.level = UNIVERSITY_LEVELS[0];
                } else if (!["SCHOOL", "UNIVERSITY"].includes(value)
                        && [...SCHOOL_LEVELS, ...UNIVERSITY_LEVELS].includes(updated.level)) {
                    updated.level = "Podstawy";
                }
            }
            return updated;
        });
    };

    const submit = async (event) => {
        event.preventDefault();

        if (!course.name.trim()) {
            setError("Podaj nazwę kursu.");
            return;
        }
        if (course.category === "LANGUAGE" && (
            !course.courseLanguage
            || !course.cefrLevel
            || !course.cefrEndLevel
            || CEFR_LEVELS.indexOf(course.cefrEndLevel) < CEFR_LEVELS.indexOf(course.cefrLevel)
        )) {
            setError("Wybierz poprawny zakres poziomów CEFR.");
            return;
        }

        try {
            setSaving(true);
            setError("");

            await apiFetch(isEditing ? `/courses/${courseId}` : "/courses", {
                method: isEditing ? "PUT" : "POST",
                body: JSON.stringify({
                    ...course,
                    price: ["ONE_TIME", "FLEXIBLE", "MONTHLY_OPTIONS"].includes(course.billingMode)
                        ? Number(course.price || 0)
                        : 0,
                    monthlyPrice: ["SUBSCRIPTION", "FLEXIBLE", "MONTHLY_OPTIONS"].includes(course.billingMode)
                        ? Number(course.monthlyPrice || 0)
                        : 0
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
                <BsArrowLeft />{t("Wróć do kursów")}</button>

            <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20">
                <header className="border-b border-white/10 p-6 sm:p-8">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20">
                            <BsCollection size={30} />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">{t("EduHub Creator")}</p>
                            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                                {isEditing ? t("Edytuj kurs") : t("Nowy kurs")}
                            </h1>
                            <p className="mt-2 max-w-2xl text-slate-400">{t("Uzupełnij informacje widoczne dla uczniów. Moduły i lekcje dodasz po zapisaniu kursu.")}</p>
                        </div>
                    </div>
                </header>

                <form onSubmit={submit} className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-6">
                        {error && (
                            <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-200">
                                {t(error)}
                            </div>
                        )}

                        <fieldset className="rounded-2xl border border-cyan-400/30 bg-cyan-400/5 p-5">
                            <legend className="px-2 text-sm font-bold text-cyan-200">{t("Język treści kursu")}</legend>
                            <p className="text-sm leading-6 text-slate-300">{t("Wybierz język, w którym napiszesz tytuł, opis, etapy, lekcje i zadania. Cały kurs trafi do tego katalogu — niezależnie od języka interfejsu administratora.")}</p>
                            <label htmlFor="course-content-language" className="sr-only">{t("Język treści kursu")}</label>
                            <select id="course-content-language" name="contentLanguage" value={course.contentLanguage} onChange={updateField} className={`${fieldClass} mt-4`}>
                                {CONTENT_LANGUAGES.map(item => <option key={item.value} value={item.value}>{t(item.label)} ({item.value.toUpperCase()})</option>)}
                            </select>
                            <p className="mt-3 text-xs leading-5 text-slate-400">{t("To nie jest język nauczany na kursie. Kurs angielskiego z polskimi instrukcjami należy do katalogu polskiego.")}</p>
                            {isEditing && <p className="mt-3 text-xs leading-5 text-amber-200">{t("Zmiana tego pola przenosi kurs do innego katalogu, ale nie tłumaczy jego materiałów. Wersję w innym języku dodaj jako osobny kurs.")}</p>}
                        </fieldset>

                        <fieldset>
                            <legend className="text-sm font-bold text-slate-300">{t("Rodzaj ścieżki nauki")}</legend>
                            <p className="mt-1 text-xs leading-5 text-slate-500">{t("Kategoria decyduje, w której części katalogu pojawi się kurs i jak będzie wyglądał certyfikat.")}</p>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {COURSE_CATEGORIES.map((category) => {
                                    const Icon = category.value === "LANGUAGE"
                                        ? BsTranslate
                                        : category.value === "SCHOOL"
                                            ? BsMortarboard
                                            : category.value === "UNIVERSITY"
                                                ? BsBuildings
                                        : category.value === "DIGITAL_SKILLS"
                                            ? BsLaptop
                                            : BsCodeSlash;
                                    const selected = course.category === category.value;

                                    return (
                                        <label
                                            key={category.value}
                                            className={`cursor-pointer rounded-2xl border p-4 transition ${
                                                selected
                                                    ? "border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/10"
                                                    : "border-white/10 bg-black/20 hover:border-white/20"
                                            }`}
                                        >
                                            <input
                                                className="sr-only"
                                                type="radio"
                                                name="category"
                                                value={category.value}
                                                checked={selected}
                                                onChange={updateField}
                                            />
                                            <Icon className={selected ? "text-cyan-300" : "text-slate-500"} size={22} />
                                            <span className="mt-3 block text-sm font-black">{t(category.label)}</span>
                                            <span className="mt-1 block text-xs leading-5 text-slate-500">
                                                {t(category.description)}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        </fieldset>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <label className="space-y-2">
                                <span className="flex items-center gap-2 text-sm font-bold text-slate-300">
                                    <BsBookHalf />{t(" Nazwa kursu")}</span>
                                <input
                                    name="name"
                                    value={course.name}
                                    onChange={updateField}
                                    placeholder={t("np. INF.03")}
                                    className={fieldClass}
                                    required
                                />
                            </label>

                            <label className="space-y-2">
                                <span className="text-sm font-bold text-slate-300">{t("Tytuł wyświetlany")}</span>
                                <input
                                    name="title"
                                    value={course.title}
                                    onChange={updateField}
                                    placeholder={t("np. Tworzenie aplikacji webowych")}
                                    className={fieldClass}
                                />
                            </label>
                        </div>

                        <fieldset>
                            <legend className="text-sm font-bold text-slate-300">{t("Sposób dostępu do kursu")}</legend>
                            <p className="mt-1 text-xs leading-5 text-slate-500">{t("Możesz udostępnić kurs bezpłatnie, jednorazowo, w abonamencie lub dać uczniowi wybór.")}</p>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                                {[
                                    ["FREE", "Bezpłatny", "Dostęp bez płatności"],
                                    ["ONE_TIME", "Jednorazowo", "Dostęp bezterminowy"],
                                    ["SUBSCRIPTION", "Abonament", "Dostęp na miesiąc"],
                                    ["FLEXIBLE", "Wybór", "Bezterminowo lub abonament"],
                                    ["MONTHLY_OPTIONS", "30 dni", "Z odnowieniem lub bez"]
                                ].map(([value, label, description]) => (
                                    <label key={value} className={`cursor-pointer rounded-xl border p-3 transition ${course.billingMode === value ? "border-cyan-300 bg-cyan-300/10" : "border-white/10 bg-black/20 hover:border-white/20"}`}>
                                        <input className="sr-only" type="radio" name="billingMode" value={value} checked={course.billingMode === value} onChange={updateField} />
                                        <span className="block text-sm font-black">{t(label)}</span>
                                        <span className="mt-1 block text-[11px] leading-4 text-slate-500">{t(description)}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        {(course.billingMode === "ONE_TIME" || course.billingMode === "FLEXIBLE") && (
                            <label className="block space-y-2">
                                <span className="text-sm font-bold text-slate-300">{t("Link do płatności jednorazowej")}</span>
                                <input name="paymentUrl" type="url" value={course.paymentUrl} onChange={updateField} placeholder={t("https://checkout.revolut.com/pay/...")} className={fieldClass} />
                            </label>
                        )}

                        {(course.billingMode === "SUBSCRIPTION" || course.billingMode === "FLEXIBLE") && (
                            <label className="block space-y-2">
                                <span className="text-sm font-bold text-slate-300">{t("Link do płatności miesięcznej")}</span>
                                <input name="monthlyPaymentUrl" type="url" value={course.monthlyPaymentUrl} onChange={updateField} placeholder={t("https://checkout.revolut.com/pay/...")} className={fieldClass} />
                                <span className="block text-xs leading-5 text-slate-500">{t("Po zatwierdzeniu płatności dostęp będzie aktywny przez jeden miesiąc.")}</span>
                            </label>
                        )}

                        <label className="block space-y-2">
                            <span className="text-sm font-bold text-slate-300">{t("Opis")}</span>
                            <textarea
                                name="description"
                                value={course.description}
                                onChange={updateField}
                                placeholder={t("Krótko opisz, czego uczeń nauczy się w tym kursie.")}
                                rows={5}
                                className={`${fieldClass} resize-y`}
                            />
                        </label>

                        <div className={`grid gap-5 ${course.category === "LANGUAGE" ? "sm:grid-cols-2 xl:grid-cols-3" : "sm:grid-cols-2"}`}>
                            {course.category === "LANGUAGE" ? (
                                <>
                                    <label className="space-y-2">
                                        <span className="text-sm font-bold text-slate-300">{t("Język")}</span>
                                        <select
                                            name="courseLanguage"
                                            value={course.courseLanguage}
                                            onChange={updateField}
                                            className={fieldClass}
                                        >
                                            {COURSE_LANGUAGES.map((language) => (
                                                <option key={language.value} value={language.value}>
                                                    {t(language.label)}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="space-y-2">
                                        <span className="text-sm font-bold text-slate-300">{t("Poziom początkowy")}</span>
                                        <select
                                            name="cefrLevel"
                                            value={course.cefrLevel}
                                            onChange={updateField}
                                            className={fieldClass}
                                        >
                                            {CEFR_LEVELS.map((level) => (
                                                <option key={level} value={level}>{level}</option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="space-y-2">
                                        <span className="text-sm font-bold text-slate-300">{t("Poziom końcowy")}</span>
                                        <select
                                            name="cefrEndLevel"
                                            value={course.cefrEndLevel}
                                            onChange={updateField}
                                            className={fieldClass}
                                        >
                                            {CEFR_LEVELS
                                                .filter((level) => CEFR_LEVELS.indexOf(level) >= CEFR_LEVELS.indexOf(course.cefrLevel))
                                                .map((level) => (
                                                    <option key={level} value={level}>{level}</option>
                                                ))}
                                        </select>
                                    </label>
                                </>
                            ) : course.category === "SCHOOL" ? (
                                <label className="space-y-2">
                                    <span className="text-sm font-bold text-slate-300">{t("Klasa")}</span>
                                    <select
                                        name="level"
                                        value={course.level}
                                        onChange={updateField}
                                        className={fieldClass}
                                    >
                                        {SCHOOL_LEVELS.map((level) => (
                                            <option key={level} value={level}>{level}</option>
                                        ))}
                                    </select>
                                </label>
                            ) : course.category === "UNIVERSITY" ? (
                                <label className="space-y-2">
                                    <span className="text-sm font-bold text-slate-300">{t("Poziom studiów")}</span>
                                    <select
                                        name="level"
                                        value={course.level}
                                        onChange={updateField}
                                        className={fieldClass}
                                    >
                                        {UNIVERSITY_LEVELS.map((level) => (
                                            <option key={level} value={level}>{level}</option>
                                        ))}
                                    </select>
                                </label>
                            ) : (
                                <label className="space-y-2">
                                    <span className="text-sm font-bold text-slate-300">{t("Poziom")}</span>
                                    <select
                                        name="level"
                                        value={course.level}
                                        onChange={updateField}
                                        className={fieldClass}
                                    >
                                        <option value="Podstawy">{t("Podstawy")}</option>
                                        <option value="Średniozaawansowany">{t("Średniozaawansowany")}</option>
                                        <option value="Zaawansowany">{t("Zaawansowany")}</option>
                                    </select>
                                </label>
                            )}

                            {(course.billingMode === "ONE_TIME" || course.billingMode === "FLEXIBLE" || course.billingMode === "MONTHLY_OPTIONS") && (
                                <label className="space-y-2">
                                    <span className="text-sm font-bold text-slate-300">{course.billingMode === "MONTHLY_OPTIONS" ? t("Cena za 30 dni bez odnowienia (zł)") : t("Cena jednorazowa (zł)")}</span>
                                    <input name="price" type="number" min="0.01" step="0.01" value={course.price} onChange={updateField} className={fieldClass} />
                                </label>
                            )}
                            {(course.billingMode === "SUBSCRIPTION" || course.billingMode === "FLEXIBLE" || course.billingMode === "MONTHLY_OPTIONS") && (
                                <label className="space-y-2">
                                    <span className="text-sm font-bold text-slate-300">{t("Cena miesięczna (zł)")}</span>
                                    <input name="monthlyPrice" type="number" min="0.01" step="0.01" value={course.monthlyPrice} onChange={updateField} className={fieldClass} />
                                </label>
                            )}
                        </div>

                        <label className="block space-y-2">
                            <span className="text-sm font-bold text-slate-300">{t("Adres własnej okładki (opcjonalnie)")}</span>
                            <input
                                name="thumbnailUrl"
                                type="url"
                                value={course.thumbnailUrl}
                                onChange={updateField}
                                placeholder={t("https://...")}
                                className={fieldClass}
                            />
                            <span className="block text-xs leading-5 text-slate-500">{t("Bez adresu EduHub automatycznie dobierze przygotowaną okładkę na podstawie nazwy kursu.")}</span>
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
                                <span className="block font-bold">{t("Opublikowany")}</span>
                                <span className="mt-1 block text-sm text-slate-500">{t("Opublikowany kurs jest widoczny dla uczniów. Administrator zawsze widzi wszystkie kursy.")}</span>
                            </span>
                        </label>
                    </div>

                    <aside className="space-y-5">
                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950">
                            <img
                                src={getCourseCover(course)}
                                alt={t("Podgląd okładki kursu")}
                                onError={({ currentTarget }) => {
                                    currentTarget.onerror = null;
                                    currentTarget.src = getGeneratedCourseCover(course);
                                }}
                                className="aspect-[3/2] w-full object-cover"
                            />
                            <div className="p-5">
                                <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">{t("Podgląd")}</p>
                                <h2 className="mt-2 text-xl font-black">
                                    {course.title || course.name || t("Nazwa kursu")}
                                </h2>
                                <p className="mt-2 text-sm text-slate-500">
                                    {course.category === "LANGUAGE"
                                        ? t("Ścieżka językowa")
                                        : course.category === "SCHOOL"
                                            ? t("Technikum · {value0}", { value0: course.level })
                                            : course.category === "UNIVERSITY"
                                                ? t("Uczelnia · {value0}", { value0: course.level })
                                                : t(course.level)}
                                </p>
                                {course.category === "LANGUAGE" && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-black text-violet-200">
                                            {t(getCourseLanguageLabel(course.courseLanguage))}
                                        </span>
                                        <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-black text-cyan-200">
                                            CEFR {course.cefrLevel}{course.cefrEndLevel !== course.cefrLevel ? `–${course.cefrEndLevel}` : ""}
                                        </span>
                                    </div>
                                )}
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
                                ? t("Zapisywanie...")
                                : isEditing
                                    ? t("Zapisz zmiany")
                                    : t("Utwórz kurs")}
                        </button>
                    </aside>
                </form>
            </section>
        </div>
    );
}

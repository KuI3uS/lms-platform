import { useLocale } from "../context/LocaleContext";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getCourseDescription, isJavaBackendCourse, JAVA_COURSE_PATH } from "../utils/javaCourseOffer";
import { BsArrowClockwise, BsCheckCircle, BsCollection, BsExclamationTriangle, BsHourglassSplit, BsLockFill, BsPencil, BsPlusCircle, BsSearch, BsTrash, BsX } from "react-icons/bs";
import { apiFetch } from "../api/api";
import { getCourseCover, getGeneratedCourseCover } from "../utils/courseCover";
import { getCategoryDefinition, getCourseCategory, getCourseLanguageLabel, getCourseLevelLabel } from "../utils/courseTaxonomy";
import { courseBillingLabel, courseProgress, filterCoursesByName, isPaidCourse, sortCoursesForLearning } from "../utils/courseCatalog";
import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../context/FeedbackContext";
import { CONTENT_LANGUAGES, contentLanguageLabel, contentLanguageOf, courseCatalogPath, courseMatchesLanguage } from "../utils/courseContentLanguage";

import WorkspacePageHeader from "../components/WorkspacePageHeader";

function getErrorMessage(error) {
    try {
        const response = JSON.parse(error.message);
        return response.detail || response.message || response.error || "Wystąpił nieoczekiwany błąd.";
    } catch {
        return error.message || "Wystąpił nieoczekiwany błąd.";
    }
}

function CourseSkeleton() {
    return <div aria-hidden="true" className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="aspect-[16/7] animate-pulse bg-slate-200" /><div className="space-y-4 p-5"><div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" /><div className="h-12 animate-pulse rounded bg-slate-100" /><div className="h-10 animate-pulse rounded-lg bg-slate-100" /></div></div>;
}

function CourseCard({ course, isAdmin, deleting, onDelete, onEdit, onOpen }) {
    const { t, dateLocale } = useLocale();
    const category = getCourseCategory(course);
    const definition = getCategoryDefinition(category);
    const progress = courseProgress(course);
    const pending = course.accessStatus === "PENDING" && !course.canAccess && !isAdmin;
    const locked = !course.canAccess && !isAdmin;
    const description = getCourseDescription(course);
    const displayDescription = course.description?.trim() === description
        && !/^Opis kursu zostanie uzupełniony wkrótce\.?$/i.test(description) ? description : t(description);
    const actionLabel = pending ? t("Sprawdź płatność") : locked ? t("Zobacz opcje dostępu") : t("Otwórz plan kursu");
    const price = value => new Intl.NumberFormat(dateLocale, {
        style: "currency", currency: "PLN", maximumFractionDigits: Number(value || 0) % 1 === 0 ? 0 : 2
    }).format(Number(value || 0));
    const prices = [course.price, course.monthlyPrice].map(Number).filter(value => value > 0);
    const displayPrice = !isPaidCourse(course) ? t("Bezpłatnie")
        : course.billingMode === "SUBSCRIPTION" ? `${price(course.monthlyPrice)} ${t("/ mies.")}`
            : ["FLEXIBLE", "MONTHLY_OPTIONS"].includes(course.billingMode)
                ? t("od {value1}", { value1: price(prices.length ? Math.min(...prices) : 0) })
                : price(course.price);

    return (
        <article className="product-catalog-card">
            <img src={getCourseCover(course)} alt="" loading="lazy" decoding="async" className="product-catalog-cover" onError={({ currentTarget }) => { currentTarget.onerror = null; currentTarget.src = getGeneratedCourseCover(course); }} />
            <div className="product-catalog-card-body">
                <div className="product-card-meta">
                    <span className="product-card-category">{t(definition.label)}</span>
                    {isAdmin && <span className={`product-status ${course.published === false ? "product-status-warning" : "product-status-neutral"}`}>{course.published === false ? t("Szkic kursu") : t("Opublikowany")}</span>}
                    <span className="product-card-language" title={t(contentLanguageLabel(contentLanguageOf(course)))}>{contentLanguageOf(course).toUpperCase()}</span>
                </div>
                <h3>{course.title || course.name}</h3>
                <p className="product-card-description">{displayDescription}</p>
                {isJavaBackendCourse(course) && <Link reloadDocument to={`${JAVA_COURSE_PATH}?lang=${contentLanguageOf(course)}`} className="mt-3 text-sm font-medium text-teal-800 underline underline-offset-4">{t("Szczegółowy program")}</Link>}
                <div className="product-card-info"><span>{course.lessonCount ?? 0} {t("lekcji")}</span><span>{course.moduleCount ?? 0} {t("etapów")}</span><span>{category === "LANGUAGE" ? `${t(getCourseLanguageLabel(course.courseLanguage))} · ` : ""}{t(getCourseLevelLabel(course))}</span></div>
                {!locked && <div className="product-card-progress"><div><span>{t("Ukończono")} {course.completedLessonCount ?? 0} {t("z")} {course.lessonCount ?? 0} {t("lekcji")}</span><span>{progress}%</span></div><div className="product-progress-track" role="progressbar" aria-label={t("Postęp kursu")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div></div>}
                <div className="product-card-bottom">
                    <div className="product-card-price"><strong>{displayPrice}</strong><span>{t(courseBillingLabel(course))}</span></div>
                    {pending && <p className="product-status product-status-warning mb-3">{t("Płatność oczekuje")}</p>}
                    <button type="button" className={`product-button ${pending ? "" : "product-button-primary"}`} onClick={onOpen}>{pending ? <BsHourglassSplit aria-hidden="true" /> : locked ? <BsLockFill aria-hidden="true" /> : null}{actionLabel}</button>
                    {isAdmin && <div className="product-card-admin"><button type="button" onClick={onEdit}><BsPencil aria-hidden="true" />{t("Edytuj")}</button><button type="button" onClick={onDelete} disabled={deleting}><BsTrash aria-hidden="true" />{deleting ? t("Usuwanie…") : t("Usuń")}</button></div>}
                </div>
            </div>
        </article>
    );
}

export default function CoursesPage() {
    const { user } = useAuth();
    const { language } = useLocale();
    return <CourseCatalog key={`${user?.id ?? user?.email ?? "guest"}:${user?.role ?? "unknown"}:${language}`} user={user} />;
}

function CourseCatalog({ user }) {
    const { t, language } = useLocale();
    const { confirm } = useFeedback();
    const navigate = useNavigate();
    const location = useLocation();
    const searchInput = useRef(null);
    const isAdmin = user?.role === "ADMIN";
    const [view, setView] = useState("catalog");
    const [activeSection, setActiveSection] = useState("all");
    const [query, setQuery] = useState("");
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [deletingCourseId, setDeletingCourseId] = useState(null);
    const [reload, setReload] = useState(0);
    const [contentLanguageFilter, setContentLanguageFilter] = useState("all");
    const allLanguages = isAdmin && contentLanguageFilter === "all";
    const catalogLanguage = isAdmin && !allLanguages ? contentLanguageFilter : language;

    useEffect(() => {
        let active = true;
        apiFetch(courseCatalogPath(view === "mine" ? "/courses/my" : "/courses", catalogLanguage, { allLanguages }))
            .then(data => { if (active) setCourses((data || []).filter(course => allLanguages || courseMatchesLanguage(course, catalogLanguage))); })
            .catch(loadError => { if (active) setError(getErrorMessage(loadError)); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [view, reload, catalogLanguage, allLanguages]);

    useEffect(() => {
        if (!location.state?.focusCourseSearch) return undefined;
        const frame = window.requestAnimationFrame(() => searchInput.current?.focus());
        return () => window.cancelAnimationFrame(frame);
    }, [location.key, location.state?.focusCourseSearch]);

    const changeView = nextView => {
        if (view === nextView) return;
        setLoading(true);
        setError("");
        setCourses([]);
        setView(nextView);
    };
    const refresh = () => { setLoading(true); setError(""); setReload(value => value + 1); };
    const clearSearch = () => { setQuery(""); searchInput.current?.focus(); };
    const deleteCourse = async course => {
        const title = course.title || course.name;
        if (!await confirm({ title: t("Usuń kurs"), message: t("Usunąć kurs „{value1}” wraz z całą jego zawartością?", { value1: title }), confirmLabel: t("Usuń kurs") })) return;
        try {
            setDeletingCourseId(course.id);
            setError("");
            await apiFetch(`/courses/${course.id}`, { method: "DELETE" });
            setCourses(current => current.filter(item => item.id !== course.id));
        } catch (deleteError) {
            setError(getErrorMessage(deleteError));
        } finally {
            setDeletingCourseId(null);
        }
    };

    const matchingCourses = useMemo(() => filterCoursesByName(courses, query), [courses, query]);
    const recommended = useMemo(() => sortCoursesForLearning(matchingCourses).slice(0, 6), [matchingCourses]);
    const sections = {
        all: { label: t("Wszystkie"), description: t("Wybierz kurs lub zawęź katalog do tego, czego teraz potrzebujesz."), items: matchingCourses },
        recommended: { label: t("Polecane"), description: t("Najpierw rozpoczęte kursy i dostępne dla Ciebie programy. Do sześciu propozycji z katalogu."), items: recommended },
        paid: { label: t("Płatne"), description: t("Kursy z dostępem jednorazowym, na 30 dni lub w abonamencie — zależnie od oferty."), items: matchingCourses.filter(isPaidCourse) },
        free: { label: t("Darmowe"), description: t("Kursy, które możesz rozpocząć bez opłat."), items: matchingCourses.filter(course => !isPaidCourse(course)) },
        school: { label: t("Dla szkół"), description: t("Przedmioty szkolne i materiały dla uczniów technikum."), items: matchingCourses.filter(course => getCourseCategory(course) === "SCHOOL") }
    };
    const selected = sections[activeSection];
    const totalLessons = courses.reduce((sum, course) => sum + Number(course.lessonCount || 0), 0);
    const averageProgress = courses.length ? Math.round(courses.reduce((sum, course) => sum + courseProgress(course), 0) / courses.length) : 0;

    return (
        <div className="product-page product-catalog">
            {location.state?.message && <div role="status" className="product-panel mb-5 p-4 text-sm text-teal-800"><BsCheckCircle aria-hidden="true" className="inline mr-2" />{t(location.state.message)}</div>}
            <WorkspacePageHeader title={view === "mine" ? t("Moje kursy") : t("Kursy")}
                description={isAdmin ? t("Zarządzaj programami, sprawdzaj publikację i otwieraj plany kursów.") : t("Wybierz temat i sposób dostępu. Ucz się w swoim tempie.")}
                actions={isAdmin && <button type="button" onClick={() => navigate("/admin/add-course")} className="product-button product-button-primary"><BsPlusCircle aria-hidden="true" />{t("Dodaj kurs")}</button>}
            />
            <section aria-label={t("Wybierz kurs")}>
                <div className="product-catalog-language">
                    {isAdmin ? <label>{t("Język treści kursu")}<select value={contentLanguageFilter} onChange={event => { setCourses([]); setError(""); setLoading(true); setContentLanguageFilter(event.target.value); }}><option value="all">{t("Wszystkie języki")}</option>{CONTENT_LANGUAGES.map(item => <option key={item.value} value={item.value}>{t(item.label)} ({item.value.toUpperCase()})</option>)}</select></label> : <p>{t("Katalog w języku: {value1}", { value1: t(contentLanguageLabel(language)) })}</p>}
                    <details className="product-language-help"><summary>{t("Jak działają wersje językowe?")}</summary><p>{t("Każda wersja ma własne kursy, etapy i lekcje. Zmiana języka nie tłumaczy materiałów ani nie usuwa zakupów i postępu.")}</p></details>
                </div>
                <div className="product-catalog-toolbar">
                    {!isAdmin && <div className="product-view-switch" aria-label={t("Widok katalogu")}>{[{ value: "catalog", label: t("Katalog") }, { value: "mine", label: t("Moje kursy") }].map(item => <button key={item.value} type="button" aria-pressed={view === item.value} onClick={() => changeView(item.value)}>{item.label}</button>)}</div>}
                    <form role="search" aria-label={t("Wyszukiwanie kursów")} onSubmit={event => event.preventDefault()} className="product-catalog-search">
                        <label htmlFor="course-name-search" className="sr-only">{t("Szukaj kursu po nazwie")}</label><BsSearch aria-hidden="true" className="shrink-0" /><input ref={searchInput} id="course-name-search" type="search" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); clearSearch(); } }} autoComplete="off" maxLength={120} placeholder={t("Szukaj po nazwie, np. Java lub angielski")} />{query && <button type="button" onClick={clearSearch} aria-label={t("Wyczyść wyszukiwanie kursów")}><BsX aria-hidden="true" /></button>}
                    </form>
                </div>
                <nav aria-label={t("Kategorie kursów")} className="product-catalog-filters">{Object.entries(sections).map(([key, section]) => <button key={key} type="button" aria-pressed={activeSection === key} onClick={() => setActiveSection(key)}>{section.label}<span>{loading ? "—" : section.items.length}</span></button>)}</nav>
                <div className="product-catalog-description"><p>{selected.description}</p><p role="status" aria-live="polite">{loading ? t("Ładowanie kursów…") : t("Liczba wyników: {value1}", { value1: selected.items.length })}</p></div>
            </section>

            {error && <div role="alert" className="product-error"><span><BsExclamationTriangle aria-hidden="true" className="inline mr-2" />{t(error)}</span><button type="button" onClick={refresh}><BsArrowClockwise aria-hidden="true" className="inline mr-2" />{t("Spróbuj ponownie")}</button></div>}
            {loading ? <div className="product-catalog-grid">{[0,1,2].map(item => <CourseSkeleton key={item} />)}</div> : error && courses.length === 0 ? <div className="product-empty"><h2>{t("Nie udało się pobrać katalogu")}</h2><p>{t("Spróbuj ponownie, korzystając z przycisku powyżej.")}</p></div> : selected.items.length === 0 ? <div className="product-empty">
                <BsCollection aria-hidden="true" className="mx-auto mb-4 text-2xl text-slate-400" />
                <h2>{query.trim() ? t("Nie znaleźliśmy takiego kursu") : courses.length === 0 ? view === "mine" ? t("Twoje kursy pojawią się tutaj") : t("Nie ma jeszcze kursów w tym języku") : t("W sekcji „{value1}” nie ma jeszcze kursów", { value1: selected.label })}</h2>
                {!isAdmin && !query.trim() && courses.length === 0 && <p>{t(view === "mine" ? "Zakupione kursy i postęp pozostają zapisane. Aby do nich wrócić, wybierz język, w którym kupiono kurs." : "Kursy w tej wersji pojawią się po przygotowaniu i opublikowaniu materiałów w wybranym języku. Nie pokazujemy tu kursów w innych językach.")}</p>}
                <p>{query.trim() ? t("Spróbuj krótszej nazwy albo wybierz inną kategorię. Możesz pisać bez polskich znaków.") : isAdmin ? t("Dodaj kurs, a potem uzupełnij jego etapy i lekcje.") : view === "mine" ? t("Wybierz kurs w katalogu lub aktywuj otrzymany kod dostępu.") : t("Wybierz inną sekcję lub wróć później — nowe programy pojawią się po opublikowaniu.")}</p>
                <div className="flex flex-wrap justify-center gap-3">{query.trim() && <button type="button" onClick={clearSearch} className="product-button">{t("Wyczyść wyszukiwanie")}</button>}{isAdmin && courses.length === 0 ? <button type="button" onClick={() => navigate("/admin/add-course")} className="product-button product-button-primary">{t("Dodaj pierwszy kurs")}</button> : !isAdmin && view === "mine" ? <><button type="button" onClick={() => changeView("catalog")} className="product-button product-button-primary">{t("Przejdź do katalogu")}</button><button type="button" onClick={() => navigate("/access-code")} className="product-button">{t("Mam kod dostępu")}</button></> : activeSection !== "all" && <button type="button" onClick={() => setActiveSection("all")} className="product-button">{t("Pokaż wszystkie kursy")}</button>}</div>
            </div> : <section aria-label={t("Kursy: {value1}", { value1: selected.label })} className="product-catalog-grid">{selected.items.map(course => <CourseCard key={course.id} course={course} isAdmin={isAdmin} deleting={deletingCourseId === course.id} onOpen={() => navigate(course.canAccess || isAdmin ? `/modules/${course.id}` : `/checkout/${course.id}`)} onEdit={() => navigate(`/admin/courses/${course.id}/edit`)} onDelete={() => deleteCourse(course)} />)}</section>}
            {!loading && courses.length > 0 && <footer className="product-catalog-footer"><span>{t("Kursy")}: {courses.length}</span><span>{t("Lekcje")}: {totalLessons}</span><span>{t("Średni postęp:")} {averageProgress}%</span></footer>}
        </div>
    );
}

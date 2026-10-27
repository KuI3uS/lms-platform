import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getCourseDescription, isJavaBackendCourse, JAVA_COURSE_PATH } from "../utils/javaCourseOffer";
import { BsArrowClockwise, BsArrowRight, BsCheckCircle, BsCollection, BsExclamationTriangle, BsHourglassSplit, BsLockFill, BsPencil, BsPlusCircle, BsSearch, BsTrash, BsX } from "react-icons/bs";
import { apiFetch } from "../api/api";
import { getCourseCover, getGeneratedCourseCover } from "../utils/courseCover";
import { getCategoryDefinition, getCourseCategory, getCourseLanguageLabel, getCourseLevelLabel } from "../utils/courseTaxonomy";
import { courseBillingLabel, courseProgress, filterCoursesByName, formatCoursePrice, isPaidCourse, sortCoursesForLearning } from "../utils/courseCatalog";
import { useAuth } from "../context/AuthContext";
import { useFeedback } from "../context/FeedbackContext";

const CATEGORY_STYLES = {
    SCHOOL: "border-emerald-200 bg-emerald-50 text-emerald-800",
    UNIVERSITY: "border-amber-200 bg-amber-50 text-amber-900",
    PROGRAMMING: "border-teal-200 bg-teal-50 text-teal-800",
    DIGITAL_SKILLS: "border-blue-200 bg-blue-50 text-blue-800",
    LANGUAGE: "border-violet-200 bg-violet-50 text-violet-800"
};

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
    const category = getCourseCategory(course);
    const definition = getCategoryDefinition(category);
    const progress = courseProgress(course);
    const pending = course.accessStatus === "PENDING" && !course.canAccess && !isAdmin;
    const locked = !course.canAccess && !isAdmin;
    const actionLabel = pending ? "Sprawdź płatność" : locked ? "Zobacz opcje dostępu" : "Otwórz plan kursu";

    return (
        <article className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-slate-300">
            <img src={getCourseCover(course)} alt={`Okładka kursu ${course.title || course.name}`} loading="lazy" decoding="async" className="aspect-[16/7] w-full bg-slate-100 object-cover" onError={({ currentTarget }) => { currentTarget.onerror = null; currentTarget.src = getGeneratedCourseCover(course); }} />
            <div className="flex flex-1 flex-col p-5 sm:p-6">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <span className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${CATEGORY_STYLES[category] || CATEGORY_STYLES.PROGRAMMING}`}>{definition.label}</span>
                    {isAdmin && <span className={`rounded-md border px-2 py-1 text-[11px] font-semibold ${course.published === false ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-slate-50 text-slate-600"}`}>{course.published === false ? "Szkic kursu" : "Opublikowany"}</span>}
                    {pending && <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-900"><BsHourglassSplit aria-hidden="true" /> Płatność oczekuje</span>}
                </div>
                <h3 className="text-xl font-semibold leading-snug tracking-tight text-slate-900">{course.title || course.name}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{getCourseDescription(course)}</p>
                {isJavaBackendCourse(course) && <Link reloadDocument to={JAVA_COURSE_PATH} className="mt-3 text-sm font-semibold text-teal-800 underline decoration-teal-800/30 underline-offset-4 hover:decoration-teal-800">Zobacz szczegółowy program →</Link>}
                <div className="mt-5 flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-100 pt-4 text-xs text-slate-500">
                    <span>{course.lessonCount ?? 0} lekcji</span><span>{course.moduleCount ?? 0} etapów</span><span>{category === "LANGUAGE" ? `${getCourseLanguageLabel(course.courseLanguage)} · ` : ""}{getCourseLevelLabel(course)}</span>
                </div>

                {!locked && <div className="mt-4">
                    <div className="mb-2 flex justify-between gap-2 text-xs text-slate-500"><span>Ukończono {course.completedLessonCount ?? 0} z {course.lessonCount ?? 0} lekcji</span><span className="font-semibold text-teal-800">{progress}%</span></div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-700" style={{ width: `${progress}%` }} /></div>
                </div>}

                <div className="mt-auto pt-5">
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-2"><span className="text-lg font-semibold tracking-tight text-slate-900">{formatCoursePrice(course)}</span><span className="text-xs text-slate-500">{courseBillingLabel(course)}</span></div>
                    <button type="button" onClick={onOpen} className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${pending ? "border border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100" : "bg-teal-800 text-white hover:bg-teal-900"}`}>
                        {pending ? <BsHourglassSplit aria-hidden="true" /> : locked ? <BsLockFill aria-hidden="true" /> : null}{actionLabel}<BsArrowRight aria-hidden="true" />
                    </button>
                    {isAdmin && <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-200 pt-4">
                        <button type="button" onClick={onEdit} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-teal-700 hover:text-teal-800"><BsPencil aria-hidden="true" /> Edytuj</button>
                        <button type="button" onClick={onDelete} disabled={deleting} className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-50"><BsTrash aria-hidden="true" /> {deleting ? "Usuwanie…" : "Usuń"}</button>
                    </div>}
                </div>
            </div>
        </article>
    );
}

export default function CoursesPage() {
    const { user } = useAuth();
    return <CourseCatalog key={`${user?.id ?? user?.email ?? "guest"}:${user?.role ?? "unknown"}`} user={user} />;
}

function CourseCatalog({ user }) {
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

    useEffect(() => {
        let active = true;
        apiFetch(view === "mine" ? "/courses/my" : "/courses")
            .then(data => { if (active) setCourses(data || []); })
            .catch(loadError => { if (active) setError(getErrorMessage(loadError)); })
            .finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [view, reload]);

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
        if (!await confirm({ title: "Usuń kurs", message: `Usunąć kurs „${title}” wraz z całą jego zawartością?`, confirmLabel: "Usuń kurs" })) return;
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
        all: { label: "Wszystkie", description: "Wybierz kurs lub zawęź katalog do tego, czego teraz potrzebujesz.", items: matchingCourses },
        recommended: { label: "Polecane", description: "Najpierw rozpoczęte kursy i dostępne dla Ciebie programy. Do sześciu propozycji z katalogu.", items: recommended },
        paid: { label: "Płatne", description: "Kursy z dostępem jednorazowym, na 30 dni lub w abonamencie — zależnie od oferty.", items: matchingCourses.filter(isPaidCourse) },
        free: { label: "Darmowe", description: "Kursy, które możesz rozpocząć bez opłat.", items: matchingCourses.filter(course => !isPaidCourse(course)) },
        school: { label: "Dla szkół", description: "Przedmioty szkolne i materiały dla uczniów technikum.", items: matchingCourses.filter(course => getCourseCategory(course) === "SCHOOL") }
    };
    const selected = sections[activeSection];
    const totalLessons = courses.reduce((sum, course) => sum + Number(course.lessonCount || 0), 0);
    const averageProgress = courses.length ? Math.round(courses.reduce((sum, course) => sum + courseProgress(course), 0) / courses.length) : 0;

    return (
        <div className="app-enter mx-auto max-w-7xl space-y-6 pb-8 text-slate-900">
            {location.state?.message && <div role="status" className="flex items-center gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900"><BsCheckCircle aria-hidden="true" className="shrink-0" />{location.state.message}</div>}
            <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">Biblioteka nauki</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{view === "mine" ? "Moje kursy" : isAdmin ? "Kursy w EduHub" : "Czego chcesz się nauczyć?"}</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{isAdmin ? "Zarządzaj programami, sprawdzaj publikację i otwieraj plany kursów." : "Praktyczne kursy, jasny program i nauka we własnym tempie. Wybierz swój następny krok."}</p></div>
                {isAdmin && <button type="button" onClick={() => navigate("/admin/add-course")} className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"><BsPlusCircle aria-hidden="true" /> Dodaj kurs</button>}
            </header>

            <section aria-label="Wybierz kurs" className="space-y-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {!isAdmin && <div className="flex w-fit rounded-xl border border-slate-200 bg-white p-1" aria-label="Widok katalogu">{[{ value: "catalog", label: "Katalog" }, { value: "mine", label: "Moje kursy" }].map(item => <button key={item.value} type="button" aria-pressed={view === item.value} onClick={() => changeView(item.value)} className={`rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-teal-700 ${view === item.value ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}>{item.label}</button>)}</div>}
                    <form role="search" aria-label="Wyszukiwanie kursów" onSubmit={event => event.preventDefault()} className="w-full lg:max-w-md">
                        <label htmlFor="course-name-search" className="sr-only">Szukaj kursu po nazwie</label>
                        <div className="flex items-center gap-3 rounded-xl border border-slate-300 bg-white px-3 focus-within:border-teal-700 focus-within:ring-2 focus-within:ring-teal-700/10"><BsSearch aria-hidden="true" className="shrink-0 text-slate-400" /><input ref={searchInput} id="course-name-search" type="search" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); clearSearch(); } }} autoComplete="off" maxLength={120} placeholder="Szukaj po nazwie, np. Java lub angielski" className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 [&::-webkit-search-cancel-button]:appearance-none" />{query && <button type="button" onClick={clearSearch} aria-label="Wyczyść wyszukiwanie kursów" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-teal-700"><BsX aria-hidden="true" className="text-xl" /></button>}</div>
                    </form>
                </div>
                <nav aria-label="Kategorie kursów" className="flex flex-wrap gap-2">{Object.entries(sections).map(([key, section]) => <button key={key} type="button" aria-pressed={activeSection === key} onClick={() => setActiveSection(key)} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 ${activeSection === key ? "border-teal-800 bg-teal-800 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-teal-600 hover:text-teal-800"}`}>{section.label}<span className={`text-xs ${activeSection === key ? "text-teal-100" : "text-slate-400"}`}>{loading ? "—" : section.items.length}</span></button>)}</nav>
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end"><p className="max-w-2xl text-sm leading-6 text-slate-500">{selected.description}</p><p role="status" aria-live="polite" className="shrink-0 text-xs font-medium text-slate-600">{loading ? "Ładowanie kursów…" : `Wyniki: ${selected.items.length}${query.trim() ? ` dla „${query.trim()}”` : ""}`}</p></div>
            </section>

            {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><span className="inline-flex items-start gap-2"><BsExclamationTriangle aria-hidden="true" className="mt-0.5 shrink-0" />{error}</span><button type="button" onClick={refresh} className="inline-flex items-center gap-2 font-semibold underline underline-offset-4"><BsArrowClockwise aria-hidden="true" /> Spróbuj ponownie</button></div>}

            {loading ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map(item => <CourseSkeleton key={item} />)}</div> : error && courses.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><h2 className="text-xl font-semibold">Nie udało się pobrać katalogu</h2><p className="mt-2 text-sm text-slate-600">Spróbuj ponownie, korzystając z przycisku powyżej.</p></div> : selected.items.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                <BsCollection aria-hidden="true" className="mx-auto text-3xl text-slate-400" />
                <h2 className="mt-4 text-xl font-semibold">{query.trim() ? "Nie znaleźliśmy takiego kursu" : courses.length === 0 ? view === "mine" ? "Twoje kursy pojawią się tutaj" : "Katalog czeka na pierwsze kursy" : `W sekcji „${selected.label}” nie ma jeszcze kursów`}</h2>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{query.trim() ? "Spróbuj krótszej nazwy albo wybierz inną kategorię. Możesz pisać bez polskich znaków." : isAdmin ? "Dodaj kurs, a potem uzupełnij jego etapy i lekcje." : view === "mine" ? "Wybierz kurs w katalogu lub aktywuj otrzymany kod dostępu." : "Wybierz inną sekcję lub wróć później — nowe programy pojawią się po opublikowaniu."}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">{query.trim() && <button type="button" onClick={clearSearch} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">Wyczyść wyszukiwanie</button>}{isAdmin && courses.length === 0 ? <button type="button" onClick={() => navigate("/admin/add-course")} className="rounded-xl bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900">Dodaj pierwszy kurs</button> : !isAdmin && view === "mine" ? <><button type="button" onClick={() => changeView("catalog")} className="rounded-xl bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900">Przejdź do katalogu</button><button type="button" onClick={() => navigate("/access-code")} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-50">Mam kod dostępu</button></> : activeSection !== "all" && <button type="button" onClick={() => setActiveSection("all")} className="rounded-xl bg-teal-800 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-900">Pokaż wszystkie kursy</button>}</div>
            </div> : <section aria-label={`Kursy: ${selected.label}`} className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{selected.items.map(course => <CourseCard key={course.id} course={course} isAdmin={isAdmin} deleting={deletingCourseId === course.id} onOpen={() => navigate(course.canAccess || isAdmin ? `/modules/${course.id}` : `/checkout/${course.id}`)} onEdit={() => navigate(`/admin/courses/${course.id}/edit`)} onDelete={() => deleteCourse(course)} />)}</section>}

            {!loading && courses.length > 0 && <footer className="flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-200 pt-5 text-xs text-slate-500"><span>{courses.length} kursów w {view === "mine" ? "Twoim widoku" : "katalogu"}</span><span>{totalLessons} lekcji łącznie</span><span>Średni postęp: {averageProgress}%</span></footer>}
        </div>
    );
}

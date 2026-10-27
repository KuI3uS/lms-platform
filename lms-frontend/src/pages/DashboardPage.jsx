import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import { fetchLearningStats } from "../api/learningStats";
import { getCourseCover, getGeneratedCourseCover } from "../utils/courseCover";
import { courseProgress, sortCoursesForLearning } from "../utils/courseCatalog";
import { BsArrowRight, BsArrowClockwise, BsBook, BsCheck2, BsKey, BsClipboardCheck, BsTranslate } from "react-icons/bs";
import { useAuth } from "../context/AuthContext";

const CACHE_PREFIX = "eduhub-dashboard-v4";

function readCache(owner) {
    try {
        const cached = JSON.parse(sessionStorage.getItem(`${CACHE_PREFIX}:${owner}`));
        return cached && Array.isArray(cached.courses) ? cached : {};
    } catch {
        return {};
    }
}

function writeCache(owner, data) {
    try {
        sessionStorage.setItem(`${CACHE_PREFIX}:${owner}`, JSON.stringify(data));
    } catch {
        // The page also works when browser storage is unavailable.
    }
}

function greeting() {
    const hour = Number(new Intl.DateTimeFormat("pl-PL", {
        timeZone: "Europe/Warsaw", hour: "2-digit", hour12: false
    }).format(new Date()));
    return hour < 18 ? "Dzień dobry" : "Dobry wieczór";
}

function formatDate(value) {
    if (!value || !Number.isFinite(new Date(value).getTime())) return null;
    return new Intl.DateTimeFormat("pl-PL", {
        timeZone: "Europe/Warsaw", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
    }).format(new Date(value));
}

export default function DashboardPage() {
    const { user } = useAuth();
    const owner = `${user?.id ?? user?.email ?? "guest"}:${user?.role ?? "unknown"}`;
    return <DashboardContent key={owner} user={user} owner={owner} />;
}

function DashboardContent({ user, owner }) {
    const navigate = useNavigate();
    const [cached] = useState(() => readCache(owner));
    const [courses, setCourses] = useState(cached.courses || []);
    const [stats, setStats] = useState(cached.stats || null);
    const [loading, setLoading] = useState(!cached.courses);
    const [error, setError] = useState("");
    const [reload, setReload] = useState(0);

    useEffect(() => {
        let active = true;
        Promise.allSettled([apiFetch("/courses/my"), fetchLearningStats({ force: true })])
            .then(([courseResult, statsResult]) => {
                if (!active) return;
                const saved = readCache(owner);
                const nextCourses = courseResult.status === "fulfilled" ? courseResult.value || [] : saved.courses || cached.courses || [];
                const nextStats = statsResult.status === "fulfilled" ? statsResult.value || null : saved.stats || cached.stats || null;
                setCourses(nextCourses);
                setStats(nextStats);
                setError(courseResult.status === "rejected"
                    ? "Nie udało się odświeżyć kursów. Wyświetlane dane mogą być nieaktualne."
                    : statsResult.status === "rejected" ? "Kursy są gotowe, ale nie udało się odświeżyć statystyk." : "");
                if (courseResult.status === "fulfilled") writeCache(owner, { courses: nextCourses, stats: nextStats });
                setLoading(false);
            });
        return () => { active = false; };
    }, [cached, owner, reload]);

    const availableCourses = useMemo(() => sortCoursesForLearning(courses.filter(course => (
        course.canAccess && Number(course.lessonCount || 0) > 0
    ))), [courses]);
    const currentCourse = availableCourses[0] || null;
    const completed = availableCourses.filter(course => courseProgress(course) === 100).length;
    const completedLessons = availableCourses.reduce((sum, course) => sum + Number(course.completedLessonCount || 0), 0);
    const progress = courseProgress(currentCourse);
    const firstName = user?.firstName || user?.email?.split("@")[0] || "";
    const retry = () => { setLoading(true); setReload(value => value + 1); };

    return (
        <div className="app-enter mx-auto max-w-6xl space-y-7 pb-8 text-slate-900 sm:space-y-9">
            <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
                <div>
                    <p className="text-sm font-medium text-slate-500">{greeting()}{firstName ? `, ${firstName}` : ""}</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Czas na kolejny krok.</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-600">Twoje kursy i najważniejsze rzeczy do nauki — w jednym miejscu.</p>
                </div>
                <button type="button" onClick={() => navigate("/courses")} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold transition hover:border-teal-700 hover:text-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">
                    Przeglądaj kursy <BsArrowRight aria-hidden="true" />
                </button>
            </header>

            {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <span>{error}</span>
                <button type="button" onClick={retry} className="inline-flex items-center gap-2 font-semibold underline underline-offset-4"><BsArrowClockwise aria-hidden="true" /> Odśwież dane</button>
            </div>}

            {loading ? <div role="status" className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600">Ładowanie Twoich kursów…</div> : (
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="grid md:grid-cols-[minmax(0,1fr)_230px]">
                        <div className="p-6 sm:p-8">
                            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-teal-800">{currentCourse ? progress > 0 && progress < 100 ? "Kurs w trakcie" : progress === 100 ? "Możesz wrócić do materiałów" : "Gotowy do rozpoczęcia" : "Zacznij od tego, co Cię interesuje"}</p>
                            <h2 className="mt-3 max-w-2xl text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{currentCourse ? currentCourse.title || currentCourse.name : "Znajdź swój pierwszy kurs."}</h2>
                            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">{currentCourse
                                ? "Otwórz plan kursu, wybierz etap i przejdź do lekcji. Twój dotychczasowy postęp jest zapisany."
                                : "Zajrzyj do katalogu: wybierz kurs bezpłatny, płatny lub materiał do nauki szkolnej."}</p>
                            {currentCourse && <div className="mt-5 max-w-md">
                                <div className="mb-2 flex justify-between text-xs font-medium text-slate-600"><span>{currentCourse.completedLessonCount || 0} z {currentCourse.lessonCount || 0} lekcji</span><span>{progress}%</span></div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-700" style={{ width: `${progress}%` }} /></div>
                            </div>}
                            <button type="button" onClick={() => navigate(currentCourse ? `/modules/${currentCourse.id}` : "/courses")} className="mt-6 inline-flex items-center gap-3 rounded-xl bg-teal-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">
                                {currentCourse ? "Otwórz plan kursu" : "Wybierz kurs"} <BsArrowRight aria-hidden="true" />
                            </button>
                        </div>
                        <div className="hidden border-l border-slate-200 bg-[#eef2ed] p-6 md:flex md:items-center md:justify-center">
                            {currentCourse ? <img src={getCourseCover(currentCourse)} alt="" className="aspect-square w-full rounded-xl bg-[#080f17] object-contain" onError={({ currentTarget }) => { currentTarget.onerror = null; currentTarget.src = getGeneratedCourseCover(currentCourse); }} /> : <BsBook className="text-6xl text-teal-800/60" aria-hidden="true" />}
                        </div>
                    </div>
                </section>
            )}

            <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px]">
                <section aria-labelledby="dashboard-courses-title">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 id="dashboard-courses-title" className="text-xl font-semibold tracking-tight">Twoje kursy</h2>
                        <span className="text-sm text-slate-500">{availableCourses.length} z lekcjami</span>
                    </div>
                    <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        {loading ? <p className="p-5 text-sm text-slate-500">Pobieranie kursów…</p> : availableCourses.length === 0 ? <div className="p-6">
                            <p className="font-medium">{error ? "Nie mamy jeszcze danych do wyświetlenia." : "Nie masz jeszcze dostępnego kursu z lekcjami."}</p>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{error ? "Spróbuj odświeżyć dane przyciskiem powyżej." : "Sprawdź katalog lub użyj otrzymanego kodu dostępu."}</p>
                        </div> : availableCourses.slice(0, 5).map(course => <button key={course.id} type="button" onClick={() => navigate(`/modules/${course.id}`)} className="group flex w-full items-center gap-4 p-4 text-left transition hover:bg-teal-50/50 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-teal-700 sm:p-5">
                            <img src={getCourseCover(course)} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-lg object-cover" onError={({ currentTarget }) => { currentTarget.onerror = null; currentTarget.src = getGeneratedCourseCover(course); }} />
                            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold leading-5 sm:text-base">{course.title || course.name}</span><span className="mt-1 block text-xs text-slate-500">{course.completedLessonCount || 0} z {course.lessonCount || 0} lekcji · {courseProgress(course)}%{user?.role === "ADMIN" && !course.published ? " · Szkic kursu" : ""}</span></span>
                            {courseProgress(course) === 100 ? <BsCheck2 aria-label="Kurs ukończony" className="shrink-0 text-xl text-teal-700" /> : <BsArrowRight aria-hidden="true" className="shrink-0 text-slate-400 group-hover:text-teal-800" />}
                        </button>)}
                    </div>
                    {availableCourses.length > 5 && <button type="button" onClick={() => navigate("/courses")} className="mt-3 text-sm font-semibold text-teal-800 underline underline-offset-4">Zobacz pozostałe kursy w katalogu</button>}
                </section>

                <aside className="space-y-6">
                    <section aria-labelledby="dashboard-summary-title" className="rounded-2xl border border-slate-200 bg-[#f1f3ed] p-5">
                        <h2 id="dashboard-summary-title" className="text-sm font-semibold">W skrócie</h2>
                        <dl className="mt-4 grid grid-cols-2 gap-4"><div><dt className="text-xs text-slate-600">Ukończone lekcje</dt><dd className="mt-1 text-2xl font-semibold">{loading ? "—" : completedLessons}</dd></div><div><dt className="text-xs text-slate-600">Ukończone kursy</dt><dd className="mt-1 text-2xl font-semibold">{loading ? "—" : completed}</dd></div></dl>
                        {stats && <div className="mt-5 border-t border-slate-300/70 pt-4 text-xs leading-6 text-slate-600"><p><strong className="font-semibold text-slate-900">Poziom {stats.level || 1}</strong> · {stats.xp || 0} XP</p><p>Seria zadań: {stats.taskStreak || 0} · mnożnik ×{stats.xpMultiplier || 1}</p>{stats.taskStreak > 0 && formatDate(stats.taskStreakExpiresAt) && <p>Aktywna do {formatDate(stats.taskStreakExpiresAt)}.</p>}</div>}
                    </section>
                    <section aria-labelledby="dashboard-shortcuts-title"><h2 id="dashboard-shortcuts-title" className="mb-3 text-sm font-semibold">Przydatne skróty</h2><div className="space-y-2">{[
                        { to: "/access-code", icon: BsKey, title: "Mam kod dostępu", description: "Aktywuj dostęp do kursu" },
                        { to: "/results", icon: BsClipboardCheck, title: "Moje wyniki", description: "Sprawdź rozwiązane zadania" },
                        { to: "/language-reviews", icon: BsTranslate, title: "Powtórki językowe", description: "Wróć do poznanych słów" }
                    ].map(({ to, icon: Icon, title, description }) => <button key={to} type="button" onClick={() => navigate(to)} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-teal-700 focus-visible:outline-2 focus-visible:outline-teal-700"><Icon aria-hidden="true" className="shrink-0 text-lg text-teal-800" /><span><span className="block text-sm font-medium">{title}</span><span className="mt-0.5 block text-xs text-slate-500">{description}</span></span></button>)}</div></section>
                </aside>
            </div>
        </div>
    );
}

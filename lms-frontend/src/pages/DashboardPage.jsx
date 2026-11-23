import { useLocale } from "../context/LocaleContext";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import { fetchLearningStats } from "../api/learningStats";
import { getCourseCover, getGeneratedCourseCover } from "../utils/courseCover";
import { courseProgress, sortCoursesForLearning } from "../utils/courseCatalog";
import { BsArrowClockwise, BsCheck2, BsKey, BsClipboardCheck, BsTranslate } from "react-icons/bs";
import { useAuth } from "../context/AuthContext";
import { courseCatalogPath, courseLocaleCacheOwner, courseMatchesLanguage } from "../utils/courseContentLanguage";

import WorkspacePageHeader from "../components/WorkspacePageHeader";

const CACHE_PREFIX = "eduhub-dashboard-v5";

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

function formatDate(value, dateLocale) {
    if (!value || !Number.isFinite(new Date(value).getTime())) return null;
    return new Intl.DateTimeFormat(dateLocale, {
        timeZone: "Europe/Warsaw", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit"
    }).format(new Date(value));
}

export default function DashboardPage() {
    const { user } = useAuth();
    const { language } = useLocale();
    const owner = courseLocaleCacheOwner(`${user?.id ?? user?.email ?? "guest"}:${user?.role ?? "unknown"}`, language);
    return <DashboardContent key={owner} user={user} owner={owner} />;
}

function DashboardContent({ user, owner }) {
    const { t, dateLocale, language } = useLocale();
    const navigate = useNavigate();
    const [cached] = useState(() => readCache(owner));
    const [courses, setCourses] = useState(cached.courses || []);
    const [stats, setStats] = useState(cached.stats || null);
    const [loading, setLoading] = useState(!cached.courses);
    const [error, setError] = useState("");
    const [reload, setReload] = useState(0);

    useEffect(() => {
        let active = true;
        Promise.allSettled([apiFetch(courseCatalogPath("/courses/my", language)), fetchLearningStats({ force: true })])
            .then(([courseResult, statsResult]) => {
                if (!active) return;
                const saved = readCache(owner);
                const nextCourses = (courseResult.status === "fulfilled" ? courseResult.value || [] : saved.courses || cached.courses || [])
                    .filter(course => courseMatchesLanguage(course, language));
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
    }, [cached, owner, reload, language]);

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
        <div className="product-page product-dashboard">
            <WorkspacePageHeader
                eyebrow={<>{t(greeting())}{firstName ? `, ${firstName}` : ""}</>}
                title={t("Moja nauka")}
                description={t("Wróć do rozpoczętego kursu lub wybierz coś nowego. Każdy krok zostaje zapisany.")}
                actions={<button type="button" onClick={() => navigate("/courses")} className="product-button">{t("Przeglądaj kursy")}</button>}
            />

            {error && <div role="alert" className="product-error"><span>{t(error)}</span><button type="button" onClick={retry}><BsArrowClockwise aria-hidden="true" className="inline mr-2" />{t("Odśwież dane")}</button></div>}
            <dl className="product-summary" aria-label={t("Podsumowanie nauki")}>
                <div><dt>{t("Dostępne kursy")}</dt><dd>{loading ? "—" : availableCourses.length}</dd></div>
                <div><dt>{t("Ukończone lekcje")}</dt><dd>{loading ? "—" : completedLessons}</dd></div>
                <div><dt>{t("Ukończone kursy")}</dt><dd>{loading ? "—" : completed}</dd></div>
            </dl>

            <div className="product-dashboard-grid">
                <div className="min-w-0">
                    {loading ? <div role="status" className="product-panel p-7 mb-7 text-slate-500">{t("Ładowanie Twoich kursów…")}</div> : <section className="product-panel product-continue" aria-labelledby="continue-course-title">
                        <div>
                            <span className="product-status product-status-positive">{currentCourse ? progress > 0 && progress < 100 ? t("Kurs w trakcie") : progress === 100 ? t("Kurs ukończony") : t("Gotowy do rozpoczęcia") : t("Zacznij swoją naukę")}</span>
                            <h2 id="continue-course-title">{currentCourse ? currentCourse.title || currentCourse.name : t("Znajdź swój pierwszy kurs.")}</h2>
                            <p>{currentCourse ? t("Wybierz etap na ścieżce kursu i ucz się we własnym tempie.") : t("Zajrzyj do katalogu: wybierz kurs bezpłatny, płatny lub materiał do nauki szkolnej.")}</p>
                            {currentCourse && <><div className="product-progress-label"><span>{currentCourse.completedLessonCount || 0} {t("z")} {currentCourse.lessonCount || 0} {t("lekcji")}</span><span>{progress}%</span></div><div className="product-progress-track" role="progressbar" aria-label={t("Postęp kursu")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div></>}
                            <button type="button" className="product-button product-button-primary" onClick={() => navigate(currentCourse ? `/modules/${currentCourse.id}` : "/courses")}>{currentCourse ? t("Otwórz plan kursu") : t("Wybierz kurs")}</button>
                        </div>
                        {currentCourse && <img src={getCourseCover(currentCourse)} alt="" onError={({ currentTarget }) => { currentTarget.onerror = null; currentTarget.src = getGeneratedCourseCover(currentCourse); }} />}
                    </section>}

                    <section aria-labelledby="dashboard-courses-title">
                        <div className="product-section-heading"><h2 id="dashboard-courses-title">{t("Twoje kursy")}</h2><span>{loading ? "—" : availableCourses.length} {t("z lekcjami")}</span></div>
                        <div className="product-panel overflow-hidden">
                            {loading ? <p className="p-6 text-sm text-slate-500">{t("Pobieranie kursów…")}</p> : availableCourses.length === 0 ? <div className="p-6">
                                <p className="font-medium">{error ? t("Nie mamy jeszcze danych do wyświetlenia.") : t("Nie masz jeszcze dostępnego kursu z lekcjami.")}</p>
                                <p className="mt-2 text-sm text-slate-500">{error ? t("Spróbuj odświeżyć dane przyciskiem powyżej.") : t("Sprawdź katalog lub użyj otrzymanego kodu dostępu.")}</p>
                            </div> : availableCourses.slice(0,5).map(course => <button key={course.id} type="button" className="product-course-row" onClick={() => navigate(`/modules/${course.id}`)}>
                                <img src={getCourseCover(course)} alt="" loading="lazy" onError={({ currentTarget }) => { currentTarget.onerror = null; currentTarget.src = getGeneratedCourseCover(course); }} />
                                <span className="min-w-0 flex-1"><span className="product-course-row-title">{course.title || course.name}</span><span className="product-course-row-detail">{course.completedLessonCount || 0} {t("z")} {course.lessonCount || 0} {t("lekcji")}{user?.role === "ADMIN" && !course.published ? t(" · Szkic kursu") : ""}</span></span>
                                <span className="product-course-row-progress">{courseProgress(course) === 100 ? <BsCheck2 aria-label={t("Kurs ukończony")} className="inline mr-1" /> : null}{courseProgress(course)}%<span className="product-progress-track"><span style={{ width: `${courseProgress(course)}%` }} /></span></span>
                            </button>)}
                        </div>
                        {availableCourses.length > 5 && <button type="button" onClick={() => navigate("/courses")} className="mt-4 text-sm font-semibold text-teal-800 underline underline-offset-4">{t("Zobacz pozostałe kursy w katalogu")}</button>}
                    </section>
                </div>
                <aside className="product-dashboard-aside">
                    <section className="product-panel product-small-panel" aria-labelledby="dashboard-activity-title">
                        <h2 id="dashboard-activity-title">{t("Twoja aktywność")}</h2>
                        {stats ? <><div className="product-account-level">{t("Poziom")} {stats.level || 1}<span>· {stats.xp || 0} XP</span></div><p>{t("Seria zadań:")} <strong className="text-slate-700">{stats.taskStreak || 0}</strong> {t("· mnożnik ×")}{stats.xpMultiplier || 1}</p>{stats.taskStreak > 0 && formatDate(stats.taskStreakExpiresAt, dateLocale) && <p>{t("Aktywna do")} {formatDate(stats.taskStreakExpiresAt, dateLocale)}.</p>}<button type="button" className="product-button mt-5 w-full" onClick={() => navigate("/learning-center")}>{t("Postęp i nagrody")}</button></> : <p>{loading ? t("Ładowanie statystyk…") : t("Twoja aktywność pojawi się po odświeżeniu danych.")}</p>}
                    </section>
                    <section className="product-panel product-small-panel" aria-labelledby="dashboard-shortcuts-title">
                        <h2 id="dashboard-shortcuts-title">{t("Przydatne skróty")}</h2>
                        <div className="product-shortcuts mt-2">{[
                            { to: "/access-code", icon: BsKey, title: t("Mam kod dostępu"), description: t("Aktywuj dostęp do kursu") },
                            { to: "/results", icon: BsClipboardCheck, title: t("Moje wyniki"), description: t("Sprawdź rozwiązane zadania") },
                            { to: "/language-reviews", icon: BsTranslate, title: t("Powtórki językowe"), description: t("Wróć do poznanych słów") }
                        ].map(({ to, icon: Icon, title, description }) => <button key={to} type="button" onClick={() => navigate(to)}><Icon aria-hidden="true" /><span><strong>{title}</strong><small>{description}</small></span></button>)}</div>
                    </section>
                </aside>
            </div>
        </div>
    );
}

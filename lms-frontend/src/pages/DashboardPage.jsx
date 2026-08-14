import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import { fetchLearningStats } from "../api/learningStats";
import { getCourseCover, getGeneratedCourseCover } from "../utils/courseCover";
import {
    BsArrowRight,
    BsBook,
    BsCheck2,
    BsChevronRight,
    BsClock,
    BsFire,
    BsLightningChargeFill,
    BsLock,
    BsPlayFill,
    BsStars
} from "react-icons/bs";
import { useAuth } from "../context/AuthContext";

const CACHE_PREFIX = "eduhub-dashboard-v3";

function dashboardCacheKey() {
    return `${CACHE_PREFIX}:session`;
}

function readCache() {
    try {
        return JSON.parse(sessionStorage.getItem(dashboardCacheKey())) || {};
    } catch {
        return {};
    }
}

function writeCache(next) {
    try {
        sessionStorage.setItem(dashboardCacheKey(), JSON.stringify({ ...readCache(), ...next }));
    } catch {
        // Dashboard działa również bez pamięci podręcznej.
    }
}

function greeting() {
    const hour = Number(new Intl.DateTimeFormat("pl-PL", {
        timeZone: "Europe/Warsaw",
        hour: "2-digit",
        hour12: false
    }).format(new Date()));
    if (hour < 12) return "Dzień dobry";
    if (hour < 18) return "Dobrego popołudnia";
    return "Dobry wieczór";
}

function formatDate(value) {
    if (!value) return null;
    return new Intl.DateTimeFormat("pl-PL", {
        timeZone: "Europe/Warsaw",
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit"
    }).format(new Date(value));
}

function chooseCurrentCourse(courses) {
    return [...courses]
        .filter((course) => course.canAccess && Number(course.lessonCount || 0) > 0)
        .sort((a, b) => {
            const aStarted = a.progress > 0 && a.progress < 100 ? 1 : 0;
            const bStarted = b.progress > 0 && b.progress < 100 ? 1 : 0;
            if (aStarted !== bStarted) return bStarted - aStarted;
            if ((a.progress || 0) !== (b.progress || 0)) return (b.progress || 0) - (a.progress || 0);
            return (b.lessonCount || 0) - (a.lessonCount || 0);
        })[0] || null;
}

export default function DashboardPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [cached] = useState(readCache);
    const [courses, setCourses] = useState(cached.courses || []);
    const [stats, setStats] = useState(cached.stats || null);
    const [loading, setLoading] = useState(!cached.courses);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        Promise.all([
            apiFetch("/courses/my"),
            fetchLearningStats()
        ]).then(([courseData, statsData]) => {
            if (!active) return;
            const nextCourses = courseData || [];
            setCourses(nextCourses);
            setStats(statsData || null);
            writeCache({ courses: nextCourses, stats: statsData || null });
        }).catch((loadError) => {
            if (active) setError(loadError.message || "Nie udało się odświeżyć planu nauki.");
        }).finally(() => {
            if (active) setLoading(false);
        });
        return () => { active = false; };
    }, []);

    const currentCourse = useMemo(() => chooseCurrentCourse(courses), [courses]);
    const availableCourses = useMemo(
        () => courses.filter((course) => course.canAccess && Number(course.lessonCount || 0) > 0),
        [courses]
    );
    const suggestedCourses = useMemo(
        () => courses.filter((course) => course.id !== currentCourse?.id).slice(0, 3),
        [courses, currentCourse]
    );
    const levelProgress = Math.min(100, Math.round(
        Number(stats?.xpIntoLevel || 0) * 100 / Math.max(1, Number(stats?.xpForNextLevel || 1))
    ));
    const courseProgress = Math.min(100, Math.max(0, Number(currentCourse?.progress || 0)));

    const openCourse = (course) => navigate(
        course.canAccess ? `/modules/${course.id}` : `/checkout/${course.id}`
    );

    if (loading) {
        return (
            <div className="mx-auto grid min-h-[70vh] max-w-7xl place-items-center">
                <div className="text-center">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-cyan-300/20 border-t-cyan-300" />
                    <p className="mt-4 text-sm font-bold text-slate-500">Układamy Twój plan na dziś…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="app-enter mx-auto max-w-7xl space-y-6 pb-8 text-white">
            <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">{greeting()}, {(user?.firstName || user?.email?.split("@")[0] || "Uczniu")}</p>
                    <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Co dziś zbudujemy?</h1>
                    <p className="mt-2 text-sm text-slate-500">Mały krok, prawdziwy kod, widoczny postęp.</p>
                </div>
                <button type="button" onClick={() => navigate("/courses")} className="flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-black text-slate-300 transition hover:border-cyan-400/30 hover:text-white sm:self-auto">
                    Wszystkie ścieżki <BsArrowRight />
                </button>
            </header>

            {error && (
                <div role="alert" className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-4 py-3 text-sm text-amber-100">
                    Pokazujemy ostatnio zapisany plan. Odśwież stronę, aby pobrać najnowsze dane.
                </div>
            )}

            <section className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.65fr)]">
                <div className="relative min-h-[330px] overflow-hidden rounded-[28px] border border-cyan-300/15 bg-[linear-gradient(125deg,rgba(8,47,73,.9),rgba(15,23,42,.96)_52%,rgba(30,27,75,.92))] p-6 sm:p-8">
                    <div className="dashboard-orb absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
                    <div className="absolute bottom-0 right-8 hidden h-64 w-64 rounded-full border border-cyan-300/10 md:block" />
                    <div className="relative z-10 flex h-full max-w-3xl flex-col">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
                            <BsStars /> Misja na dziś
                        </div>
                        {currentCourse ? (
                            <>
                                <h2 className="mt-5 max-w-2xl text-3xl font-black leading-tight sm:text-5xl">{currentCourse.title || currentCourse.name}</h2>
                                <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                                    {currentCourse.progress > 0
                                        ? "Wróć dokładnie tam, gdzie skończyłeś. Kolejny etap już czeka."
                                        : "Twoja ścieżka jest gotowa. Zacznij od pierwszej krótkiej lekcji."}
                                </p>
                                <div className="mt-auto pt-7">
                                    <div className="mb-2 flex max-w-xl items-center justify-between text-xs font-bold text-slate-400">
                                        <span>{currentCourse.completedLessonCount || 0} / {currentCourse.lessonCount || 0} lekcji</span>
                                        <span>{courseProgress}%</span>
                                    </div>
                                    <div className="h-2 max-w-xl overflow-hidden rounded-full bg-black/30">
                                        <div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-blue-500 transition-all duration-700" style={{ width: `${courseProgress}%` }} />
                                    </div>
                                    <button type="button" onClick={() => openCourse(currentCourse)} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 shadow-[0_12px_36px_rgba(103,232,249,.2)] transition hover:-translate-y-0.5 hover:bg-cyan-200">
                                        <BsPlayFill /> {courseProgress > 0 ? "Kontynuuj" : "Rozpocznij"} <BsArrowRight />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="mt-5 text-3xl font-black sm:text-5xl">Wybierz swoją pierwszą misję</h2>
                                <p className="mt-4 max-w-xl leading-7 text-slate-300">Znajdź ścieżkę, która prowadzi od krótkich lekcji do własnego projektu.</p>
                                <button type="button" onClick={() => navigate("/courses")} className="mt-8 inline-flex w-fit items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950">
                                    Odkryj kursy <BsArrowRight />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Poziom</p>
                                <p className="mt-1 text-3xl font-black">{stats?.level || 1}</p>
                            </div>
                            <div className="relative grid h-16 w-16 place-items-center rounded-full" style={{ background: `conic-gradient(#22d3ee ${levelProgress}%, rgba(255,255,255,.07) 0)` }}>
                                <div className="grid h-12 w-12 place-items-center rounded-full bg-[#0a0e17] text-xs font-black">{levelProgress}%</div>
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-slate-500"><strong className="text-slate-200">{stats?.xp || 0} XP</strong> · jeszcze {Math.max(0, Number(stats?.xpForNextLevel || 0) - Number(stats?.xpIntoLevel || 0))} XP do awansu</p>
                    </div>

                    <div className={`rounded-2xl border p-5 ${stats?.taskStreak > 0 ? "border-orange-400/15 bg-orange-400/[0.055]" : "border-white/[0.08] bg-white/[0.035]"}`}>
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-600">Seria zadań</p>
                                <p className="mt-2 text-3xl font-black">{stats?.taskStreak || 0} <span className="text-sm text-orange-200">×{stats?.xpMultiplier || 1}</span></p>
                            </div>
                            <div className="grid h-11 w-11 place-items-center rounded-xl bg-orange-400/10 text-orange-300"><BsFire size={20} /></div>
                        </div>
                        <p className="mt-4 text-xs leading-5 text-slate-500">
                            {stats?.taskStreak > 0
                                ? `Aktywna do ${formatDate(stats.taskStreakExpiresAt) || "północy czasu polskiego"}.`
                                : "Rozwiąż zadanie, aby rozpocząć dzisiejszą serię. Licznik zeruje się o północy."}
                        </p>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="rounded-[26px] border border-white/[0.08] bg-white/[0.025] p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">Twoja mapa</p>
                            <h2 className="mt-2 text-2xl font-black">Ścieżki w zasięgu</h2>
                        </div>
                        <span className="rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs font-bold text-slate-500">{availableCourses.length} aktywne</span>
                    </div>

                    <div className="mt-6 space-y-2">
                        {availableCourses.length === 0 ? (
                            <button type="button" onClick={() => navigate("/courses")} className="flex w-full items-center justify-between rounded-2xl border border-dashed border-white/10 p-5 text-left text-slate-400 hover:border-cyan-400/30">
                                <span>Dodaj pierwszą ścieżkę do swojej mapy</span><BsArrowRight />
                            </button>
                        ) : availableCourses.slice(0, 4).map((course, index) => {
                            const complete = Number(course.progress || 0) >= 100;
                            const active = course.id === currentCourse?.id;
                            return (
                                <button key={course.id} type="button" onClick={() => openCourse(course)} className={`group flex w-full items-center gap-4 rounded-2xl border p-3 text-left transition ${active ? "border-cyan-300/25 bg-cyan-300/[0.055]" : "border-transparent hover:border-white/10 hover:bg-white/[0.035]"}`}>
                                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border text-sm font-black ${complete ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : active ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-200" : "border-white/10 bg-white/[0.04] text-slate-500"}`}>
                                        {complete ? <BsCheck2 size={20} /> : index + 1}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate font-black">{course.title || course.name}</span>
                                        <span className="mt-1 block text-xs text-slate-500">{course.completedLessonCount || 0} z {course.lessonCount || 0} lekcji · {course.progress || 0}%</span>
                                    </span>
                                    <BsChevronRight className="text-slate-600 transition group-hover:translate-x-1 group-hover:text-cyan-300" />
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="rounded-[26px] border border-violet-400/15 bg-gradient-to-b from-violet-400/[0.07] to-white/[0.025] p-6">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-400/10 text-violet-300"><BsLightningChargeFill /></div>
                    <p className="mt-5 text-xs font-black uppercase tracking-[0.2em] text-violet-300">Dzienny rytm</p>
                    <h2 className="mt-2 text-2xl font-black">20 minut skupienia</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-500">Jedna lekcja i jedno zadanie wystarczą, żeby dziś ruszyć do przodu.</p>
                    <div className="mt-6 flex items-center gap-3 rounded-xl bg-black/20 p-3 text-sm text-slate-400"><BsClock className="text-cyan-300" /> Cel na dziś: 1 lekcja</div>
                </div>
            </section>

            {suggestedCourses.length > 0 && (
                <section>
                    <div className="mb-4 flex items-end justify-between">
                        <div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Następne możliwości</p>
                            <h2 className="mt-2 text-2xl font-black">Odkrywaj bez chaosu</h2>
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        {suggestedCourses.map((course) => (
                            <button key={course.id} type="button" onClick={() => openCourse(course)} className="group flex overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] text-left transition hover:-translate-y-1 hover:border-cyan-300/20">
                                <img
                                    src={getCourseCover(course)}
                                    alt=""
                                    loading="lazy"
                                    onError={({ currentTarget }) => { currentTarget.onerror = null; currentTarget.src = getGeneratedCourseCover(course); }}
                                    className="h-28 w-28 shrink-0 object-cover opacity-80 transition group-hover:opacity-100"
                                />
                                <span className="flex min-w-0 flex-1 flex-col justify-center p-4">
                                    <span className="line-clamp-2 font-black">{course.title || course.name}</span>
                                    <span className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">{course.canAccess ? <BsBook /> : <BsLock />} {course.lessonCount || 0} lekcji</span>
                                </span>
                            </button>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

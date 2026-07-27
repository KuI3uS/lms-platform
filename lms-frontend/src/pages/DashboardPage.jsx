import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import {
    getCourseCover,
    getGeneratedCourseCover
} from "../utils/courseCover";

import {
    BsArrowRight,
    BsBookHalf,
    BsFire,
    BsLightningChargeFill,
    BsPlayFill,
    BsStars,
    BsTrophyFill
} from "react-icons/bs";

const DASHBOARD_CACHE_PREFIX = "eduhub-dashboard-cache";

function getDashboardCacheKey() {
    const token = localStorage.getItem("token");
    if (!token) return `${DASHBOARD_CACHE_PREFIX}:anonymous`;

    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return `${DASHBOARD_CACHE_PREFIX}:${payload.sub || payload.email || "user"}`;
    } catch {
        return `${DASHBOARD_CACHE_PREFIX}:user`;
    }
}

function readDashboardCache() {
    try {
        return JSON.parse(sessionStorage.getItem(getDashboardCacheKey())) || {};
    } catch {
        return {};
    }
}

function updateDashboardCache(data) {
    try {
        sessionStorage.setItem(
            getDashboardCacheKey(),
            JSON.stringify({ ...readDashboardCache(), ...data })
        );
    } catch {
        // Brak miejsca w pamięci przeglądarki nie może blokować dashboardu.
    }
}

export default function DashboardPage() {

    const navigate = useNavigate();
    const [initialCache] = useState(readDashboardCache);

    const [courses, setCourses] = useState(initialCache.courses || []);
    const [submissions, setSubmissions] = useState(initialCache.submissions || []);
    const [results, setResults] = useState(initialCache.results || []);
    const [learningStats, setLearningStats] = useState(initialCache.learningStats || null);
    const [loading, setLoading] = useState(!Array.isArray(initialCache.courses));
    const [detailsLoading, setDetailsLoading] = useState(
        !Array.isArray(initialCache.submissions)
        || !Array.isArray(initialCache.results)
        || !initialCache.learningStats
    );

    useEffect(() => {
        let active = true;

        apiFetch("/courses/my")
            .then((coursesData) => {
                if (!active) return;
                const nextCourses = coursesData || [];
                setCourses(nextCourses);
                updateDashboardCache({ courses: nextCourses });
            })
            .catch((error) => console.error("Nie udało się pobrać kursów", error))
            .finally(() => {
                if (active) setLoading(false);
            });

        Promise.all([
            apiFetch("/submissions/my").catch(() => []),
            apiFetch("/my-results").catch(() => []),
            apiFetch("/learning-stats").catch(() => null)
        ]).then(([submissionsData, resultsData, statsData]) => {
            if (!active) return;
            const nextSubmissions = submissionsData || [];
            const nextResults = resultsData || [];
            setSubmissions(nextSubmissions);
            setResults(nextResults);
            setLearningStats(statsData);
            updateDashboardCache({
                submissions: nextSubmissions,
                results: nextResults,
                learningStats: statsData
            });
        }).finally(() => {
            if (active) setDetailsLoading(false);
        });

        return () => {
            active = false;
        };
    }, []);

    if (loading) {

        return (

            <div className="flex items-center justify-center h-[70vh]">

                <div className="
                    w-16
                    h-16
                    rounded-full
                    border-4
                    border-cyan-500
                    border-t-transparent
                    animate-spin
                "/>

            </div>

        );

    }

    const checked =
        submissions.filter(s => s.status === "CHECKED").length;

    const firstCourse =
        courses[0];

    const lastSubmissions = submissions.slice(0, 5);

    const xp = Number(learningStats?.xp || 0);

    const level = Number(learningStats?.level || 1);

    const progress = Number(learningStats?.xpIntoLevel || 0);
    const progressTarget = Math.max(1, Number(learningStats?.xpForNextLevel || 1));

    const statusStyle = (status) => {

        if (status === "CHECKED")
            return "bg-green-500/10 text-green-300 border-green-500/30";

        if (status === "TO_FIX")
            return "bg-orange-500/10 text-orange-300 border-orange-500/30";

        return "bg-cyan-500/10 text-cyan-300 border-cyan-500/30";
    };

    return (

        <div className="space-y-10 text-white">

            {/* ================================================= */}

            {/* HERO DASHBOARD */}

            {/* ================================================= */}

            <section
                className="
                    relative
                    overflow-hidden
                    rounded-[42px]
                    border
                    border-cyan-500/20
                    bg-gradient-to-br
                    from-slate-950
                    via-[#081325]
                    to-cyan-950
                    p-12
                "
            >

                <div className="
                    absolute
                    -left-24
                    -top-24
                    w-96
                    h-96
                    rounded-full
                    bg-cyan-500/10
                    blur-3xl
                "/>

                <div className="
                    absolute
                    -right-32
                    bottom-0
                    w-[500px]
                    h-[500px]
                    rounded-full
                    bg-blue-600/10
                    blur-3xl
                "/>

                <div className="relative z-10">

                    <div className="grid xl:grid-cols-[1.5fr_0.9fr] gap-10">

                        {/* ================================= */}

                        {/* LEWA STRONA */}

                        {/* ================================= */}

                        <div>

                            <div className="
                                inline-flex
                                items-center
                                gap-2
                                rounded-full
                                border
                                border-cyan-500/20
                                bg-cyan-500/10
                                px-5
                                py-2
                                text-cyan-300
                                font-semibold
                            ">

                                <BsStars/>

                                EDUHUB 2026

                            </div>

                            <h1 className="
                                mt-8
                                text-6xl
                                font-black
                                leading-tight
                            ">

                                Witaj ponownie.

                                <br/>

                                Kontynuuj naukę.

                            </h1>

                            <p className="
                                mt-8
                                max-w-3xl
                                text-xl
                                leading-9
                                text-gray-300
                            ">

                                Rozwiązuj kolejne zadania,
                                zdobywaj doświadczenie,
                                rozwijaj umiejętności programistyczne
                                i odblokowuj następne moduły.

                            </p>

                            {firstCourse && (

                                <button

                                    onClick={() =>
                                        navigate(`/modules/${firstCourse.id}`)
                                    }

                                    className="
                                        mt-10
                                        rounded-2xl
                                        bg-gradient-to-r
                                        from-cyan-500
                                        to-blue-600
                                        px-8
                                        py-5
                                        font-bold
                                        flex
                                        items-center
                                        gap-3
                                        hover:scale-[1.02]
                                        transition
                                        shadow-[0_20px_60px_rgba(6,182,212,0.25)]
                                    "

                                >

                                    <BsPlayFill size={20}/>

                                    Kontynuuj naukę

                                    <BsArrowRight/>

                                </button>

                            )}

                        </div>

                        {/* ================================= */}

                        {/* PRAWA STRONA */}

                        {/* ================================= */}

                        <div className="grid gap-5">

                            <div className="
                                rounded-3xl
                                border
                                border-white/10
                                bg-white/[0.05]
                                backdrop-blur-xl
                                p-7
                            ">

                                <div className="flex items-center gap-4">

                                    <div className="
                                        w-16
                                        h-16
                                        rounded-2xl
                                        bg-gradient-to-br
                                        from-cyan-500
                                        to-blue-600
                                        flex
                                        items-center
                                        justify-center
                                    ">

                                        <BsLightningChargeFill size={28}/>

                                    </div>

                                    <div>

                                        <p className="text-gray-400">

                                            Aktualny poziom

                                        </p>

                                        <h2 className="text-4xl font-black">

                                            {detailsLoading ? "—" : level}

                                        </h2>

                                    </div>

                                </div>

                                <div className="mt-7">

                                    <div className="
                                        flex
                                        justify-between
                                        mb-3
                                        text-sm
                                    ">

                                        <span className="text-gray-400">

                                            XP

                                        </span>

                                        <span>

                                            {detailsLoading
                                                ? "Ładowanie…"
                                                : `${xp} XP · ${progress} / ${progressTarget}`}

                                        </span>

                                    </div>

                                    <div className="
                                        h-3
                                        rounded-full
                                        bg-black/30
                                        overflow-hidden
                                    ">

                                        <div
                                            className="
                                                h-full
                                                rounded-full
                                                bg-gradient-to-r
                                                from-cyan-500
                                                to-blue-600
                                            "
                                            style={{
                                                width: `${detailsLoading ? 0 : Math.min(100, progress * 100 / progressTarget)}%`
                                            }}
                                        />

                                    </div>

                                </div>

                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                {/* QUICK STATS */}

                                <div className="rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-xl p-5">

                                    <div className="flex items-center justify-between">

                                        <div>

                                            <p className="text-gray-400 text-sm">

                                                Kursy

                                            </p>

                                            <h3 className="text-3xl font-black mt-2">

                                                {courses.length}

                                            </h3>

                                        </div>

                                        <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">

                                            <BsBookHalf size={24}/>

                                        </div>

                                    </div>

                                </div>

                                <div className="rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-xl p-5">

                                    <div className="flex items-center justify-between">

                                        <div>

                                            <p className="text-gray-400 text-sm">

                                                Seria

                                            </p>

                                            <h3 className="text-3xl font-black mt-2">

                                                {detailsLoading
                                                    ? "—"
                                                    : `${learningStats?.taskStreak || 0} · x${learningStats?.xpMultiplier || 1}`}

                                            </h3>

                                        </div>

                                        <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-400">

                                            <BsFire size={24}/>

                                        </div>

                                    </div>

                                </div>

                                <div className="rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-xl p-5">

                                    <div className="flex items-center justify-between">

                                        <div>

                                            <p className="text-gray-400 text-sm">

                                                Osiągnięcia

                                            </p>

                                            <h3 className="text-3xl font-black mt-2">

                                                {detailsLoading ? "—" : checked}

                                            </h3>

                                        </div>

                                        <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-400">

                                            <BsTrophyFill size={24}/>

                                        </div>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>
                </div>

            </section>


            {/* ========================================= */}

            {/* CONTINUE LEARNING */}

            {/* ========================================= */}

            <section className="space-y-6">

                <div className="flex justify-between items-center">

                    <div>

                        <h2 className="text-3xl font-black">

                            Continue Learning

                        </h2>

                        <p className="text-gray-400 mt-2">

                            Wróć do ostatnio rozpoczętej ścieżki.

                        </p>

                    </div>

                </div>

                {firstCourse && (

                    <div
                        className="
                        relative
                        overflow-hidden
                        rounded-[36px]
                        border
                        border-white/10
                        bg-gradient-to-br
                        from-[#111827]
                        via-[#0F172A]
                        to-[#111827]
                        p-10
                    "
                    >

                        <div className="absolute -right-24 -top-24 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl"/>

                        <div className="grid lg:grid-cols-[1.4fr_420px] gap-10 items-center">

                            <div>

                                <div className="inline-flex rounded-full bg-cyan-500/10 text-cyan-300 px-5 py-2 font-semibold">

                                    Aktualna ścieżka

                                </div>

                                <h2 className="text-5xl font-black mt-6">

                                    {firstCourse.title || firstCourse.name}

                                </h2>

                                <p className="mt-6 text-gray-400 text-lg leading-8 max-w-2xl">

                                    {firstCourse.description ||
                                        "Rozpocznij naukę i odblokowuj kolejne lekcje."}

                                </p>

                                <button

                                    onClick={() =>
                                        navigate(`/modules/${firstCourse.id}`)
                                    }

                                    className="
                                        mt-10
                                        rounded-2xl
                                        bg-gradient-to-r
                                        from-cyan-500
                                        to-blue-600
                                        px-8
                                        py-5
                                        font-bold
                                        flex
                                        items-center
                                        gap-3
                                        hover:scale-[1.02]
                                        transition
                                    "

                                >

                                    <BsPlayFill/>

                                    Kontynuuj

                                    <BsArrowRight/>

                                </button>

                            </div>

                            <div className="space-y-6">

                                <div>

                                    <div className="flex justify-between text-sm mb-3">

                                        <span className="text-gray-400">

                                            Postęp kursu

                                        </span>

                                        <span>

                                            {firstCourse.progress ?? 0}%

                                        </span>

                                    </div>

                                    <div className="h-4 rounded-full bg-black/30 overflow-hidden">

                                        <div

                                            className="
                                                h-full
                                                rounded-full
                                                bg-gradient-to-r
                                                from-cyan-500
                                                to-blue-600
                                            "

                                            style={{
                                                width: `${firstCourse.progress ?? 0}%`
                                            }}

                                        />

                                    </div>

                                </div>

                                <div className="grid grid-cols-2 gap-4">

                                    <div className="rounded-2xl bg-black/20 p-5">

                                        <p className="text-gray-400 text-sm">

                                            Lekcje

                                        </p>

                                        <h3 className="text-3xl font-black mt-2">

                                            {firstCourse.lessonCount ?? "-"}

                                        </h3>

                                    </div>

                                    <div className="rounded-2xl bg-black/20 p-5">

                                        <p className="text-gray-400 text-sm">

                                            Projekty

                                        </p>

                                        <h3 className="text-3xl font-black mt-2">

                                            {firstCourse.projectCount ?? "-"}

                                        </h3>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                )}

            </section>

            {/* ========================================= */}

            {/* RECOMMENDED COURSES */}

            {/* ========================================= */}

            <section className="space-y-6">

                <div className="flex justify-between items-center">

                    <h2 className="text-3xl font-black">

                        Polecane ścieżki

                    </h2>

                </div>

                <div className="grid lg:grid-cols-3 gap-6">

                    {courses.slice(0,3).map(course=>(

                        <button

                            key={course.id}

                            onClick={()=>navigate(`/modules/${course.id}`)}

                            className="
                                group
                                text-left
                                rounded-[30px]
                                border
                                border-white/10
                                bg-white/[0.04]
                                overflow-hidden
                                hover:border-cyan-500
                                transition
                            "

                        >

                            <img

                                src={getCourseCover(course)}

                                alt={course.title || course.name}

                                loading="lazy"

                                decoding="async"

                                onError={({ currentTarget }) => {
                                    currentTarget.onerror = null;
                                    currentTarget.src = getGeneratedCourseCover(course);
                                }}

                                className="
                                    w-full
                                    h-52
                                    object-cover
                                    group-hover:scale-105
                                    transition
                                "

                            />

                            <div className="p-6">

                                <h3 className="text-2xl font-black">

                                    {course.title || course.name}

                                </h3>

                                <p className="mt-3 text-gray-400 line-clamp-3">

                                    {course.description}

                                </p>

                            </div>

                        </button>

                    ))}

                </div>

            </section>

            {/* ========================================= */}

            {/* RECENT ACTIVITY + WEEKLY */}

            {/* ========================================= */}

            {/* RECENT ACTIVITY */}

            <div className="space-y-5">

                <h2 className="text-3xl font-black">

                    Ostatnia aktywność

                </h2>

                {detailsLoading ? (
                    <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-8 text-center">
                        <div className="mx-auto h-6 w-40 animate-pulse rounded-full bg-white/10" />
                    </div>
                ) : lastSubmissions.length === 0 ? (

                    <div className="rounded-[32px] border border-white/10 bg-white/[0.04] p-8 text-center">

                        <p className="text-gray-400">

                            Nie wysłałeś jeszcze żadnych prac.

                        </p>

                    </div>

                ) : (

                    lastSubmissions.map((submission) => (

                        <ActivityCard
                            key={submission.id}
                            submission={submission}
                            statusStyle={statusStyle}
                        />

                    ))

                )}

            </div>

            {/* PRAWA KOLUMNA */}

            <div className="space-y-6">

                <div className="rounded-[32px] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8">

                    <h2 className="text-2xl font-black">

                        Weekly Progress

                    </h2>

                    <p className="text-gray-400 mt-2">

                        Aktywność z ostatnich dni.

                    </p>

                    <div className="mt-8 space-y-5">

                        <ProgressRow
                            label="Przesłane prace"
                            value={submissions.length}
                            max={10}
                        />

                        <ProgressRow
                            label="Sprawdzone"
                            value={checked}
                            max={10}
                        />

                        <ProgressRow
                            label="Testy"
                            value={results.length}
                            max={10}
                        />

                    </div>

                </div>

                <div className="rounded-[32px] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-8">

                    <h2 className="text-2xl font-black">

                        Achievements

                    </h2>

                    <div className="space-y-4 mt-6">

                        <AchievementCard

                            title="Pierwszy krok"

                            description="Rozpocznij pierwszy kurs."

                            active={courses.length > 0}

                        />

                        <AchievementCard

                            title="Pierwsza praca"

                            description="Wyślij rozwiązanie."

                            active={submissions.length > 0}

                        />

                        <AchievementCard

                            title="Pierwsza ocena"

                            description="Odbierz ocenę nauczyciela."

                            active={checked > 0}

                        />

                        <AchievementCard
                            title="Mistrz nauki"
                            description="Ukończ cały kurs."
                            active={false}
                        />

                    </div>

                </div>

            </div>

        </div>


);

}

/* ========================================================= */
/* COMPONENTS */
/* ========================================================= */

function ProgressRow({ label, value, max }) {

    const percent = Math.min((value / max) * 100, 100);



    return (

        <div>

            <div className="flex justify-between text-sm mb-2">

                <span className="text-gray-400">

                    {label}

                </span>

                <span className="font-bold">

                    {value}

                </span>

            </div>

            <div className="h-3 rounded-full bg-black/30 overflow-hidden">

                <div

                    className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"

                    style={{ width: `${percent}%` }}

                />

            </div>

        </div>

    );

}

function ActivityCard({ submission, statusStyle }) {

    return (

        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6">

            <div className="flex justify-between items-start gap-5">

                <div>

                    <h3 className="text-xl font-black">

                        {submission.lesson?.title || "Lekcja"}

                    </h3>

                    <p className="text-gray-400 mt-2">

                        {submission.submittedAt
                            ?.replace("T", " ")
                            .substring(0, 16)}

                    </p>

                </div>

                <span

                    className={`
                        px-4
                        py-2
                        rounded-full
                        border
                        text-sm
                        font-semibold
                        ${statusStyle(submission.status)}
                    `}

                >

                    {submission.status}

                </span>

            </div>

            {submission.grade && (

                <div className="mt-6">

                    <p className="text-gray-400 text-sm">

                        Ocena

                    </p>

                    <h3 className="text-3xl font-black mt-2">

                        {submission.grade}

                    </h3>

                </div>

            )}

            {submission.teacherComment && (

                <div className="mt-6 rounded-2xl bg-black/20 border border-white/5 p-5">

                    <p className="text-cyan-300 font-semibold mb-2">

                        Komentarz nauczyciela

                    </p>

                    <p className="text-gray-300 whitespace-pre-wrap">

                        {submission.teacherComment}

                    </p>

                </div>

            )}

        </div>

    );

}

function AchievementCard({ title, description, active }) {

    return (

        <div

            className={`
                rounded-2xl
                border
                p-5
                transition

                ${
                active
                    ? "border-cyan-500/30 bg-cyan-500/10"
                    : "border-white/10 bg-black/20 opacity-60"
            }
            `}

        >

            <h3 className="font-black text-lg">

                {title}

            </h3>

            <p className="text-gray-400 mt-2">

                {description}

            </p>

            <div className="mt-5">

                <span

                    className={`
                        inline-flex
                        rounded-full
                        px-4
                        py-2
                        text-sm
                        font-semibold

                        ${
                        active
                            ? "bg-cyan-500/20 text-cyan-300"
                            : "bg-white/10 text-gray-400"
                    }
                    `}

                >

                    {active ? "Odblokowane" : "Zablokowane"}

                </span>

            </div>
        </div>

);

}

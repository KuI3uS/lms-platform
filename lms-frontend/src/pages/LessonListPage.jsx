import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";

import {
    BsArrowRight,
    BsPlayFill,
    BsLightningChargeFill,
    BsStars,
    BsBookHalf,
    BsCheckCircleFill,
    BsFire, BsTrophyFill, BsCheckCircle, BsLockFill
} from "react-icons/bs";

export default function LessonListPage() {

    const { moduleId } = useParams();
    const navigate = useNavigate();

    const [lessons, setLessons] = useState([]);
    const [moduleName, setModuleName] = useState("Ścieżka nauki");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {

        load();

    }, [moduleId]);

    const load = async () => {

        setLoading(true);
        setError(null);

        try {

            const [
                moduleData,
                lessonsData
            ] = await Promise.all([

                apiFetch(`/modules/${moduleId}`).catch(() => null),

                apiFetch(`/lessons/module/${moduleId}`)

            ]);

            if (moduleData?.name) {

                setModuleName(moduleData.name);

            }

            const withAccess = await Promise.all(

                (lessonsData || []).map(async lesson => {

                    try {

                        const canAccess =
                            await apiFetch(`/lessons/${lesson.id}/access`);

                        return {
                            ...lesson,
                            canAccess
                        };

                    } catch {

                        return {
                            ...lesson,
                            canAccess: false
                        };

                    }

                })

            );

            setLessons(

                [...withAccess].sort(

                    (a, b) =>
                        (a.orderIndex ?? 0) -
                        (b.orderIndex ?? 0)

                )

            );

        }
        catch (e) {

            console.error(e);
            setError(e.message);

        }
        finally {

            setLoading(false);

        }

    };

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

    if (error) {

        return (

            <div className="
                rounded-3xl
                border
                border-red-500/30
                bg-red-500/10
                p-8
                text-red-300
            ">

                {error}

            </div>

        );

    }

    const completed =
        lessons.filter(l => l.completed).length;

    const progress =
        lessons.length
            ? Math.round((completed / lessons.length) * 100)
            : 0;

    const xp =
        completed * 20;

    const level =
        Math.max(
            1,
            Math.floor(xp / 150) + 1
        );

    const currentLesson =
        lessons.find(
            l =>
                l.canAccess &&
                !l.completed
        ) ||
        lessons.find(
            l =>
                l.canAccess
        );

    return (

        <div className="space-y-10 text-white">

            {/* HERO */}

            <section
                className="
                    relative
                    overflow-hidden
                    rounded-[42px]
                    border
                    border-cyan-500/20
                    bg-gradient-to-br
                    from-slate-950
                    via-[#071425]
                    to-cyan-950
                    p-12
                "
            >

                <div className="
                    absolute
                    -top-24
                    -left-24
                    w-96
                    h-96
                    rounded-full
                    bg-cyan-500/10
                    blur-3xl
                "/>

                <div className="
                    absolute
                    -bottom-32
                    -right-20
                    w-[420px]
                    h-[420px]
                    rounded-full
                    bg-blue-600/10
                    blur-3xl
                "/>

                <div className="relative z-10">

                    <div className="grid xl:grid-cols-[1.5fr_0.9fr] gap-10">

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

                                {moduleName}

                            </h1>

                            <p className="
                                mt-7
                                max-w-3xl
                                text-xl
                                leading-9
                                text-gray-300
                            ">

                                Zdobywaj kolejne umiejętności,
                                rozwiązuj zadania,
                                odblokowuj nowe lekcje
                                i rozwijaj swoje doświadczenie.

                            </p>

                            {currentLesson && (

                                <button

                                    onClick={() =>
                                        navigate(`/lesson/${currentLesson.id}`)
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

                                    Kontynuuj naukę

                                    <BsArrowRight/>

                                </button>

                            )}

                        </div>

                        <div className="space-y-5">

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

                                            Poziom

                                        </p>

                                        <h2 className="text-4xl font-black">

                                            {level}

                                        </h2>

                                    </div>

                                </div>

                                <div className="mt-7">

                                    <div className="flex justify-between mb-3 text-sm">

                                        <span className="text-gray-400">

                                            Postęp modułu

                                        </span>

                                        <span>

                                            {progress}%

                                        </span>

                                    </div>

                                    <div className="h-3 rounded-full bg-black/30 overflow-hidden">

                                        <div

                                            className="
                                                h-full
                                                rounded-full
                                                bg-gradient-to-r
                                                from-cyan-500
                                                to-blue-600
                                            "

                                            style={{
                                                width: `${progress}%`
                                            }}

                                        />

                                    </div>

                                </div>

                            </div>

                            <div className="grid grid-cols-4 gap-4">

                                {/* tutaj w części 2 będą nowoczesne statystyki */}

                            </div>

                        </div>

                    </div>

                </div>

            </section>
            <div className="grid grid-cols-4 gap-4">

                <StatCard
                    icon={<BsBookHalf size={22} />}
                    value={lessons.length}
                    label="Lekcji"
                    color="cyan"
                />

                <StatCard
                    icon={<BsCheckCircleFill size={22} />}
                    value={completed}
                    label="Ukończono"
                    color="green"
                />

                <StatCard
                    icon={<BsFire size={22} />}
                    value={xp}
                    label="XP"
                    color="orange"
                />

                <StatCard
                    icon={<BsLightningChargeFill size={22} />}
                    value={level}
                    label="Level"
                    color="blue"
                />

            </div>



    {/* ===================================================== */}

    {/* CONTINUE LEARNING */}

    {/* ===================================================== */}

    {currentLesson && (

        <section
            className="
        relative
        overflow-hidden
        rounded-[40px]
        border
        border-white/10
        bg-gradient-to-br
        from-[#111827]
        via-[#081325]
        to-[#0f172a]
        p-10
    "
        >

            <div className="
        absolute
        -right-24
        -top-24
        w-80
        h-80
        rounded-full
        bg-cyan-500/10
        blur-3xl
    "/>

            <div className="relative z-10 grid lg:grid-cols-[1.5fr_360px] gap-10">

                <div>

                    <div className="
                inline-flex
                rounded-full
                bg-cyan-500/10
                px-5
                py-2
                text-cyan-300
                font-semibold
            ">

                        Następna lekcja

                    </div>

                    <h2 className="mt-6 text-5xl font-black">

                        {currentLesson.title}

                    </h2>

                    <p className="mt-6 text-gray-400 text-lg leading-8 max-w-2xl">

                        Kontynuuj naukę dokładnie tam,
                        gdzie skończyłeś.
                        Zdobywaj kolejne XP
                        i odblokowuj następne lekcje.

                    </p>

                    <button

                        onClick={() =>
                            navigate(`/lesson/${currentLesson.id}`)
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

                        <BsPlayFill />

                        Rozpocznij lekcję

                        <BsArrowRight />

                    </button>

                </div>

                <div className="space-y-5">

                    <InfoBox
                        title="Numer lekcji"
                        value={currentLesson.orderIndex ?? "-"}
                    />

                    <InfoBox
                        title="Status"
                        value="Gotowa"
                    />

                    <InfoBox
                        title="Postęp"
                        value={`${progress}%`}
                    />

                </div>

            </div>

        </section>

    )}

    {/* ===================================================== */}

    {/* LESSONS */}

    {/* ===================================================== */}

    <section className="space-y-8">

        <div>

            <h2 className="text-4xl font-black">

                Wszystkie lekcje

            </h2>

            <p className="text-gray-400 mt-3">

                Odblokowuj kolejne etapy nauki i zdobywaj doświadczenie.

            </p>

        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-7">

            {lessons.map((lesson, index) => (

                <LessonCard

                    key={lesson.id}

                    lesson={lesson}

                    index={index}

                    navigate={navigate}

                />

            ))}

        </div>

    </section>
    {/* ===================================================== */}

    {/* FINAL PROJECT */}

    {/* ===================================================== */}

    <section
        className="
        relative
        overflow-hidden
        rounded-[40px]
        border
        border-yellow-500/20
        bg-gradient-to-br
        from-[#171717]
        via-[#111827]
        to-[#1f2937]
        p-10
    "
    >

        <div className="
        absolute
        -right-20
        -bottom-20
        w-72
        h-72
        rounded-full
        bg-yellow-500/10
        blur-3xl
    "/>

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">

            <div>

                <div className="
                inline-flex
                rounded-full
                bg-yellow-500/10
                text-yellow-300
                px-5
                py-2
                font-semibold
            ">

                    Final Challenge

                </div>

                <h2 className="text-5xl font-black mt-6">

                    Projekt końcowy

                </h2>

                <p className="mt-6 text-gray-400 text-lg leading-8 max-w-2xl">

                    Po ukończeniu wszystkich lekcji odblokujesz
                    praktyczny projekt,
                    który sprawdzi Twoje umiejętności
                    w realnym zadaniu.

                </p>

            </div>

            <div className="
            w-32
            h-32
            rounded-[32px]
            bg-gradient-to-br
            from-yellow-400
            to-orange-500
            flex
            items-center
            justify-center
            shadow-2xl
        ">

                <BsTrophyFill
                    size={58}
                    className="text-white"
                />

            </div>

        </div>

    </section>

</div>

);

}

/* ===================================================== */

/* COMPONENTS */

/* ===================================================== */

function StatCard({

                      icon,
                      value,
                      label,
                      color

                  }) {

    const colors = {

        cyan: "from-cyan-500/20 to-cyan-500/5 text-cyan-300 border-cyan-500/20",

        green: "from-green-500/20 to-green-500/5 text-green-300 border-green-500/20",

        orange: "from-orange-500/20 to-orange-500/5 text-orange-300 border-orange-500/20",

        blue: "from-blue-500/20 to-blue-500/5 text-blue-300 border-blue-500/20"

    };

    return (

        <div
            className={`
                rounded-3xl
                border
                bg-gradient-to-br
                p-6
                ${colors[color]}
            `}
        >

            <div className="flex justify-between items-center">

                <div>

                    <p className="text-gray-400 text-sm">

                        {label}

                    </p>

                    <h3 className="text-4xl font-black mt-2">

                        {value}

                    </h3>

                </div>

                <div className="text-3xl">

                    {icon}

                </div>

            </div>

        </div>

    );

}

function InfoBox({

                     title,
                     value

                 }) {

    return (

        <div className="
            rounded-3xl
            border
            border-white/10
            bg-white/[0.04]
            backdrop-blur-xl
            p-6
        ">

            <p className="text-gray-400">

                {title}

            </p>

            <h3 className="text-3xl font-black mt-3">

                {value}

            </h3>

        </div>

    );

}

function LessonCard({

                        lesson,
                        index,
                        navigate

                    }) {

    const completed = lesson.completed;
    const locked = !lesson.canAccess;
    const active = lesson.canAccess && !lesson.completed;

    return (

        <button

            onClick={() => {

                if (!locked) {

                    navigate(`/lesson/${lesson.id}`);

                }

            }}

            disabled={locked}

            className={`
                group
                relative
                overflow-hidden
                rounded-[34px]
                border
                p-7
                text-left
                transition-all
                duration-300

                ${
                completed
                    ? "border-green-500/30 bg-green-500/10"
                    : active
                        ? "border-cyan-500 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 hover:scale-[1.03]"
                        : "border-white/10 bg-white/[0.03] opacity-60"
            }
            `}
        >

            <div className="
                absolute
                -right-10
                -top-10
                w-40
                h-40
                rounded-full
                bg-cyan-500/10
                blur-3xl
                opacity-0
                group-hover:opacity-100
                transition
            "/>

            <div className="relative z-10">

                <div className="flex justify-between items-center">

                    <span className="text-sm text-gray-400">

                        Lekcja {lesson.orderIndex ?? index + 1}

                    </span>

                    <div>

                        {completed && (

                            <BsCheckCircle
                                size={28}
                                className="text-green-400"
                            />

                        )}

                        {active && (

                            <BsPlayFill
                                size={28}
                                className="text-cyan-300"
                            />

                        )}

                        {locked && (

                            <BsLockFill
                                size={22}
                                className="text-gray-500"
                            />

                        )}

                    </div>

                </div>

                <h2 className="mt-6 text-2xl font-black">

                    {lesson.title}

                </h2>

                <p className="mt-4 text-gray-400">

                    {
                        completed
                            ? "Lekcja ukończona."
                            : active
                                ? "Gotowa do rozpoczęcia."
                                : "Odblokuj poprzednią lekcję."
                    }

                </p>

            </div>

        </button>

    );

}
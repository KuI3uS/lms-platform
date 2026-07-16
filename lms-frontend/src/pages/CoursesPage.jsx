import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import {
    getCourseCover,
    getGeneratedCourseCover
} from "../utils/courseCover";

import {
    BsBook,
    BsPlayFill,
    BsTrash,
    BsPencil
} from "react-icons/bs";

export default function CoursesPage() {

    const [courses, setCourses] = useState([]);

    const navigate = useNavigate();

    const token = localStorage.getItem("token");

    const role = token
        ? JSON.parse(atob(token.split(".")[1])).role
        : null;

    useEffect(() => {
        apiFetch("/courses").then(setCourses);
    }, []);

    const deleteCourse = async (id) => {

        if (!window.confirm("Usunąć kurs?"))
            return;

        await apiFetch(`/courses/${id}`, {
            method: "DELETE"
        });

        setCourses(prev => prev.filter(c => c.id !== id));
    };

    return (

        <div className="space-y-12 text-white">

            {/* ===================================================== */}
            {/* HERO */}
            {/* ===================================================== */}

            <section className="
                relative
                overflow-hidden
                rounded-[42px]
                border
                border-cyan-500/20
                bg-gradient-to-br
                from-slate-950
                via-blue-950
                to-cyan-950
                p-12
                lg:p-16
            ">

                <div className="absolute -top-32 -left-24 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" />

                <div className="absolute -bottom-40 right-0 w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-3xl" />

                <div className="relative z-10 max-w-4xl">

                    <p className="
                        uppercase
                        tracking-[0.35em]
                        text-cyan-300
                        text-sm
                        font-black
                    ">
                        EDUHUB • PROGRAMOWANIE
                    </p>

                    <h1 className="
                        mt-6
                        text-5xl
                        lg:text-7xl
                        font-black
                        leading-tight
                    ">
                        Ucz się programowania
                        <br />
                        w nowoczesny sposób.
                    </h1>

                    <p className="
                        mt-8
                        text-xl
                        leading-9
                        text-gray-300
                        max-w-3xl
                    ">
                        Interaktywne kursy, praktyczne projekty,
                        automatyczne sprawdzanie zadań oraz ścieżka
                        rozwoju od podstaw aż do poziomu Junior Developera.
                    </p>

                    <div className="flex flex-wrap gap-4 mt-10">

                        <div className="
                            rounded-full
                            border
                            border-cyan-500/30
                            bg-cyan-500/10
                            px-5
                            py-3
                            text-cyan-300
                            font-semibold
                        ">
                            Interaktywne lekcje
                        </div>

                        <div className="
                            rounded-full
                            border
                            border-blue-500/30
                            bg-blue-500/10
                            px-5
                            py-3
                            text-blue-300
                            font-semibold
                        ">
                            Projekty praktyczne
                        </div>

                        <div className="
                            rounded-full
                            border
                            border-green-500/30
                            bg-green-500/10
                            px-5
                            py-3
                            text-green-300
                            font-semibold
                        ">
                            Zadania z automatyczną oceną
                        </div>

                    </div>

                </div>

            </section>

            {/* ===================================================== */}
            {/* STATYSTYKI */}
            {/* ===================================================== */}

            <div className="grid md:grid-cols-3 gap-6">

                <div className="
                    rounded-[30px]
                    border
                    border-white/10
                    bg-white/[0.04]
                    backdrop-blur-xl
                    p-7
                ">

                    <p className="text-gray-400">
                        Dostępnych kursów
                    </p>

                    <h2 className="text-5xl font-black mt-4">
                        {courses.length}
                    </h2>

                </div>

                <div className="
                    rounded-[30px]
                    border
                    border-white/10
                    bg-white/[0.04]
                    backdrop-blur-xl
                    p-7
                ">

                    <p className="text-gray-400">
                        Łącznie lekcji
                    </p>

                    <h2 className="text-5xl font-black mt-4">
                        {courses.reduce(
                            (sum, c) => sum + (c.lessonCount || 0),
                            0
                        )}
                    </h2>

                </div>

                <div className="
                    rounded-[30px]
                    border
                    border-white/10
                    bg-white/[0.04]
                    backdrop-blur-xl
                    p-7
                ">

                    <p className="text-gray-400">
                        Ścieżka nauki
                    </p>

                    <h2 className="text-4xl font-black mt-4">
                        Beginner → Pro
                    </h2>

                </div>

            </div>

            {/* ===================================================== */}
            {/* LISTA KURSÓW */}
            {/* ===================================================== */}

            <section>

                <div className="flex items-end justify-between mb-8">

                    <div>

                        <p className="text-cyan-300 uppercase tracking-[0.3em] text-sm font-bold">
                            KURSY
                        </p>

                        <h2 className="text-4xl font-black mt-3">
                            Dostępne ścieżki nauki
                        </h2>

                    </div>

                </div>

                <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8">

                    {courses.map((course) => {

                        const progress = course.progress ?? 0;

                        return (

                            <div
                                key={course.id}
                                className="
                group
                relative
                overflow-hidden
                rounded-[34px]
                border
                border-white/10
                bg-white/[0.04]
                backdrop-blur-2xl
                transition-all
                duration-500
                hover:-translate-y-3
                hover:border-cyan-400/60
                hover:shadow-[0_20px_80px_rgba(6,182,212,0.18)]
            "
                            >

                                {/* Glow */}

                                <div className="
                absolute
                -top-24
                -right-24
                w-64
                h-64
                rounded-full
                bg-cyan-500/10
                blur-3xl
                opacity-0
                group-hover:opacity-100
                transition
                duration-700
            " />

                                {/* Obraz */}

                                <div className="relative overflow-hidden">

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
                        h-64
                        object-cover
                        transition
                        duration-700
                        group-hover:scale-105
                    "
                                    />

                                    <div className="
                    absolute
                    inset-0
                    bg-gradient-to-t
                    from-[#05070d]
                    via-transparent
                    to-transparent
                " />

                                    {/* Badge */}

                                    <div className="
                    absolute
                    top-5
                    left-5
                    flex
                    gap-2
                ">

                    <span className="
                        rounded-full
                        bg-cyan-500/15
                        border
                        border-cyan-500/30
                        px-4
                        py-2
                        text-xs
                        font-bold
                        text-cyan-300
                    ">
                        Bestseller
                    </span>

                                        <span className="
                        rounded-full
                        bg-green-500/15
                        border
                        border-green-500/30
                        px-4
                        py-2
                        text-xs
                        font-bold
                        text-green-300
                    ">
                        Nowość
                    </span>

                                    </div>

                                </div>

                                {/* Content */}

                                <div className="relative p-7 space-y-6">

                                    <div>

                                        <h3 className="
                        text-2xl
                        font-black
                        leading-tight
                    ">
                                            {course.title || course.name}
                                        </h3>

                                        <p className="
                        mt-4
                        text-gray-400
                        leading-7
                        line-clamp-3
                    ">
                                            {course.description}
                                        </p>

                                    </div>

                                    {/* Info */}

                                    <div className="
                    grid
                    grid-cols-3
                    gap-4
                ">

                                        <div className="
                        rounded-2xl
                        border
                        border-white/5
                        bg-black/20
                        p-4
                    ">

                                            <p className="text-xs uppercase tracking-widest text-gray-500">
                                                Lekcje
                                            </p>

                                            <h4 className="mt-2 text-2xl font-black">
                                                {course.lessonCount ?? 0}
                                            </h4>

                                        </div>

                                        <div className="
                        rounded-2xl
                        border
                        border-white/5
                        bg-black/20
                        p-4
                    ">

                                            <p className="text-xs uppercase tracking-widest text-gray-500">
                                                Poziom
                                            </p>

                                            <h4 className="mt-2 text-2xl font-black">
                                                {course.level || "Podstawy"}
                                            </h4>

                                        </div>

                                        <div className="
                        rounded-2xl
                        border
                        border-white/5
                        bg-black/20
                        p-4
                    ">

                                            <p className="text-xs uppercase tracking-widest text-gray-500">
                                                Moduły
                                            </p>

                                            <h4 className="mt-2 text-2xl font-black">
                                                {course.moduleCount ?? "-"}
                                            </h4>

                                        </div>

                                    </div>

                                    {/* Progress */}

                                    <div>

                                        <div className="
                        flex
                        justify-between
                        mb-3
                        text-sm
                        text-gray-400
                    ">

                                            <span>Postęp kursu</span>

                                            <span>{progress}%</span>

                                        </div>

                                        <div className="
                        h-3
                        rounded-full
                        overflow-hidden
                        bg-gray-800
                    ">

                                            <div
                                                className="
                                h-full
                                rounded-full
                                bg-gradient-to-r
                                from-cyan-500
                                via-blue-500
                                to-indigo-500
                                transition-all
                                duration-700
                            "
                                                style={{
                                                    width: `${progress}%`
                                                }}
                                            />

                                        </div>

                                    </div>

                                    {/* Buttons */}

                                    <div className="flex gap-3 pt-2">

                                        <button
                                            onClick={() => navigate(`/modules/${course.id}`)}
                                            className="
                            flex-1
                            rounded-2xl
                            bg-gradient-to-r
                            from-cyan-500
                            to-blue-600
                            py-4
                            font-bold
                            flex
                            items-center
                            justify-center
                            gap-3
                            transition
                            hover:scale-[1.02]
                            shadow-xl
                        "
                                        >
                                            <BsPlayFill size={18} />
                                            Rozpocznij naukę
                                        </button>

                                        <button
                                            className="
                            w-16
                            rounded-2xl
                            border
                            border-white/10
                            bg-black/20
                            flex
                            items-center
                            justify-center
                            transition
                            hover:border-cyan-400
                            hover:bg-cyan-500/10
                        "
                                        >
                                            <BsBook size={18} />
                                        </button>

                                    </div>

                                    {/* Admin */}

                                    {role === "ADMIN" && (

                                        <div className="
                        flex
                        gap-3
                        pt-5
                        border-t
                        border-white/10
                    ">

                                            <button
                                                className="
                                flex-1
                                rounded-2xl
                                border
                                border-yellow-500/30
                                bg-yellow-500/10
                                py-3
                                transition
                                hover:bg-yellow-500/20
                            "
                                            >
                                                <BsPencil size={18} />
                                            </button>

                                            <button
                                                onClick={() => deleteCourse(course.id)}
                                                className="
                                flex-1
                                rounded-2xl
                                border
                                border-red-500/30
                                bg-red-500/10
                                py-3
                                transition
                                hover:bg-red-500/20
                            "
                                            >
                                                <BsTrash size={18} />
                                            </button>

                                        </div>

                                    )}

                                </div>

                            </div>

                        );

                    })}
                </div>

            </section>

        </div>

    );

}

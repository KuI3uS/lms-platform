import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import {
    BsBook,
    BsPlayFill,
    BsLockFill,
    BsPatchCheckFill,
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
        <div className="space-y-10 text-white">

            <section className="rounded-3xl overflow-hidden relative">

                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 opacity-90" />

                <div className="relative p-12">

                    <h1 className="text-5xl font-black mb-4">
                        Nauka Programowania
                    </h1>

                    <p className="text-xl text-blue-100 max-w-2xl">
                        Ucz się od podstaw aż do poziomu zawodowego.
                        Każdy kurs zawiera teorię, zadania,
                        projekty oraz przygotowanie do egzaminów INF.02,
                        INF.03 i matury.
                    </p>

                </div>

            </section>

            <div>

                <h2 className="text-3xl font-bold mb-6">
                    Dostępne ścieżki
                </h2>

                <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8">

                    {courses.map(course => (

                        <div
                            key={course.id}
                            className="rounded-3xl bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 hover:border-blue-500 transition overflow-hidden"
                        >

                            <img
                                src={course.thumbnailUrl}
                                alt=""
                                className="w-full h-52 object-cover"
                            />

                            <div className="p-6 space-y-5">

                                <div className="flex justify-between">

                                    <span className="bg-blue-600 px-3 py-1 rounded-full text-sm">
                                        10 lekcji GRATIS
                                    </span>

                                    <span className="text-green-400">
                                        NOWOŚĆ
                                    </span>

                                </div>

                                <div>

                                    <h2 className="text-2xl font-bold">
                                        {course.title || course.name}
                                    </h2>

                                    <p className="text-gray-400 mt-2 line-clamp-3">
                                        {course.description}
                                    </p>

                                </div>

                                <div>

                                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                                        <span>Postęp</span>
                                        <span>0%</span>
                                    </div>

                                    <div className="h-3 rounded-full bg-gray-800">

                                        <div
                                            className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                                            style={{ width: "0%" }}
                                        />

                                    </div>

                                </div>

                                <div className="flex gap-3">

                                    <button
                                        onClick={() => navigate(`/modules/${course.id}`)}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 rounded-xl py-3 font-bold flex justify-center items-center gap-2"
                                    >
                                        <BsPlayFill />
                                        Kontynuuj
                                    </button>

                                    <button
                                        className="bg-gray-800 hover:bg-gray-700 rounded-xl px-4"
                                    >
                                        <BsBook />
                                    </button>

                                </div>

                                {role === "ADMIN" && (

                                    <div className="flex gap-2 pt-3 border-t border-gray-800">

                                        <button
                                            className="flex-1 bg-yellow-600 rounded-xl py-2"
                                        >
                                            <BsPencil className="mx-auto"/>
                                        </button>

                                        <button
                                            onClick={() => deleteCourse(course.id)}
                                            className="flex-1 bg-red-600 rounded-xl py-2"
                                        >
                                            <BsTrash className="mx-auto"/>
                                        </button>

                                    </div>

                                )}

                            </div>

                        </div>

                    ))}

                </div>

            </div>

        </div>
    );
}
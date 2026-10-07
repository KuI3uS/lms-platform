import { useState } from "react";
import { apiFetch } from "../api/api";
import {
    BsCollection,
    BsBookHalf,
    BsPlusCircleFill
} from "react-icons/bs";

export default function AddCoursePage() {

    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async () => {

        if (!name.trim()) {
            alert("Podaj nazwę kursu.");
            return;
        }

        try {

            setLoading(true);

            await apiFetch("/courses", {
                method: "POST",
                body: JSON.stringify({
                    name
                })
            });

            alert("Kurs został utworzony.");

            setName("");

        } catch (e) {

            alert(e.message);

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,.15),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(147,51,234,.15),transparent_35%),#030712] flex items-center justify-center p-8">

            <section className="w-full max-w-2xl rounded-[36px] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,.45)] overflow-hidden">

                <div className="relative p-10">

                    <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 blur-3xl rounded-full" />

                    <div className="relative">

                        <div className="flex items-center gap-5 mb-8">

                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-xl">

                                <BsCollection
                                    size={38}
                                    className="text-white"
                                />

                            </div>

                            <div>

                                <div className="uppercase tracking-[0.25em] text-sm text-blue-300 font-bold">

                                    EduHub Creator

                                </div>

                                <h1 className="text-4xl font-black mt-2">

                                    Nowy kurs

                                </h1>

                                <p className="text-gray-400 mt-2">

                                    Utwórz nowy kurs i rozpocznij budowę modułów,
                                    lekcji oraz interaktywnych zadań.

                                </p>

                            </div>

                        </div>

                        <div className="space-y-3">

                            <label className="flex items-center gap-2 text-gray-300 font-semibold">

                                <BsBookHalf />

                                Nazwa kursu

                            </label>

                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="np. Java od podstaw"
                                className="w-full rounded-2xl border border-white/10 bg-[#0f172a]/70 px-6 py-5 text-lg outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20"
                            />

                        </div>

                        <button
                            onClick={submit}
                            disabled={loading}
                            className="mt-10 w-full rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 hover:scale-[1.01] transition-all duration-300 py-5 font-black text-lg shadow-[0_20px_40px_rgba(37,99,235,.35)] flex items-center justify-center gap-3 disabled:opacity-60"
                        >

                            <BsPlusCircleFill size={22} />

                            {loading
                                ? "Tworzenie kursu..."
                                : "Utwórz kurs"}

                        </button>

                    </div>

                </div>

            </section>

        </div>

    );

}
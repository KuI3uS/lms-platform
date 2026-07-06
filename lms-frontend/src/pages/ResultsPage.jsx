import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import {
    BsStars,
    BsTrophyFill,
    BsCheckCircleFill,
    BsLightningChargeFill,
    BsGraphUpArrow
} from "react-icons/bs";

export default function ResultsPage() {

    const [results, setResults] = useState([]);

    useEffect(() => {
        apiFetch("/my-results").then(setResults);
    }, []);

    const average =
        results.length > 0
            ? Math.round(
                results.reduce((a, b) => a + b.percentage, 0) /
                results.length
            )
            : 0;

    const passed =
        results.filter(r => r.percentage >= 50).length;

    const best =
        results.length
            ? Math.max(...results.map(r => r.percentage))
            : 0;

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
                    via-[#081325]
                    to-cyan-950
                    p-12
                "
            >

                <div className="
                    absolute
                    -left-20
                    -top-20
                    w-96
                    h-96
                    rounded-full
                    bg-cyan-500/10
                    blur-3xl
                "/>

                <div className="
                    absolute
                    -right-20
                    bottom-0
                    w-[420px]
                    h-[420px]
                    rounded-full
                    bg-blue-600/10
                    blur-3xl
                "/>

                <div className="relative z-10">

                    <div className="
                        inline-flex
                        items-center
                        gap-2
                        rounded-full
                        bg-cyan-500/10
                        border
                        border-cyan-500/20
                        px-5
                        py-2
                        text-cyan-300
                        font-semibold
                    ">

                        <BsStars />

                        EDUHUB 2026

                    </div>

                    <h1 className="text-6xl font-black mt-7">

                        Twoje wyniki

                    </h1>

                    <p className="mt-6 max-w-3xl text-xl text-gray-300 leading-9">

                        Śledź swoje postępy,
                        analizuj wyniki testów
                        i zdobywaj kolejne osiągnięcia.

                    </p>

                </div>

            </section>

            {/* STATS */}

            <div className="grid md:grid-cols-4 gap-5">

                <StatCard
                    icon={<BsGraphUpArrow />}
                    title="Średnia"
                    value={`${average}%`}
                    color="cyan"
                />

                <StatCard
                    icon={<BsCheckCircleFill />}
                    title="Zdane"
                    value={passed}
                    color="green"
                />

                <StatCard
                    icon={<BsTrophyFill />}
                    title="Najlepszy wynik"
                    value={`${best}%`}
                    color="yellow"
                />

                <StatCard
                    icon={<BsLightningChargeFill />}
                    title="Testy"
                    value={results.length}
                    color="blue"
                />

            </div>

            {/* RESULTS */}

            <section className="space-y-6">

                <h2 className="text-3xl font-black">

                    Historia testów

                </h2>

                {results.length === 0 ? (

                    <div className="
                        rounded-[34px]
                        border
                        border-white/10
                        bg-white/[0.04]
                        backdrop-blur-xl
                        p-10
                        text-center
                        text-gray-400
                    ">

                        Nie masz jeszcze żadnych wyników.

                    </div>

                ) : (

                    <div className="grid lg:grid-cols-2 gap-7">

                        {results.map(result => (

                            <ResultCard
                                key={result.id}
                                result={result}
                            />

                        ))}

                    </div>

                )}

            </section>

        </div>

    );

}

function StatCard({

                      icon,
                      title,
                      value,
                      color

                  }) {

    const colors = {

        cyan: "text-cyan-300 bg-cyan-500/10",

        green: "text-green-300 bg-green-500/10",

        yellow: "text-yellow-300 bg-yellow-500/10",

        blue: "text-blue-300 bg-blue-500/10"

    };

    return (

        <div className="
            rounded-3xl
            border
            border-white/10
            bg-white/[0.04]
            backdrop-blur-xl
            p-6
        ">

            <div className="flex justify-between">

                <div>

                    <p className="text-gray-400">

                        {title}

                    </p>

                    <h2 className="text-4xl font-black mt-2">

                        {value}

                    </h2>

                </div>

                <div className={`
                    w-14
                    h-14
                    rounded-2xl
                    flex
                    items-center
                    justify-center
                    text-2xl
                    ${colors[color]}
                `}>

                    {icon}

                </div>

            </div>

        </div>

    );

}

function ResultCard({ result }) {

    const passed = result.percentage >= 50;

    return (

        <div
            className="
                group
                rounded-[34px]
                border
                border-white/10
                bg-white/[0.04]
                backdrop-blur-xl
                p-7
                hover:border-cyan-500
                hover:-translate-y-1
                transition
            "
        >

            <div className="flex justify-between items-start">

                <div>

                    <p className="text-cyan-300 text-sm font-semibold">

                        Test

                    </p>

                    <h2 className="text-2xl font-black mt-2">

                        {result.module.name}

                    </h2>

                </div>

                <span
                    className={`
                        rounded-full
                        px-4
                        py-2
                        text-sm
                        font-semibold

                        ${
                        passed
                            ? "bg-green-500/10 text-green-300"
                            : "bg-red-500/10 text-red-300"
                    }
                    `}
                >

                    {passed ? "ZDANY" : "NIEZDANY"}

                </span>

            </div>

            <div className="mt-8">

                <div className="flex justify-between mb-3">

                    <span className="text-gray-400">

                        Wynik

                    </span>

                    <span className="font-bold">

                        {result.percentage}%

                    </span>

                </div>

                <div className="h-4 rounded-full bg-black/30 overflow-hidden">

                    <div
                        className={`
                            h-full
                            rounded-full

                            ${
                            passed
                                ? "bg-gradient-to-r from-green-500 to-emerald-400"
                                : "bg-gradient-to-r from-red-500 to-orange-500"
                        }
                        `}
                        style={{
                            width: `${result.percentage}%`
                        }}
                    />

                </div>

            </div>

        </div>

    );

}
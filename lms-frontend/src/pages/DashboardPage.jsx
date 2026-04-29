import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";

export default function DashboardPage() {

    const [courses, setCourses] = useState([]);
    const [results, setResults] = useState([]);

    useEffect(() => {
        apiFetch("/courses").then(setCourses);
        apiFetch("/my-results").then(setResults);
    }, []);

    const totalTests = results.length;
    const avgScore =
        totalTests > 0
            ? Math.round(results.reduce((a, r) => a + r.percentage, 0) / totalTests)
            : 0;

    const bestScore =
        totalTests > 0
            ? Math.max(...results.map(r => r.percentage))
            : 0;

    return (
        <div className="space-y-8">

            <h1 className="text-3xl font-bold">Dashboard</h1>

            {/* 🔥 METRYKI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <div className="bg-gray-800 p-6 rounded-xl">
                    <p className="text-gray-400">Kursy</p>
                    <h2 className="text-3xl font-bold">{courses.length}</h2>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl">
                    <p className="text-gray-400">Testy</p>
                    <h2 className="text-3xl font-bold">{totalTests}</h2>
                </div>

                <div className="bg-gray-800 p-6 rounded-xl">
                    <p className="text-gray-400">Średni wynik</p>
                    <h2 className="text-3xl font-bold">{avgScore}%</h2>
                </div>

            </div>

            {/* 🔥 NAJLEPSZY WYNIK */}
            <div className="bg-gray-800 p-6 rounded-xl">
                <p className="text-gray-400 mb-2">Najlepszy wynik</p>
                <h2 className="text-4xl font-bold text-green-400">
                    {bestScore}%
                </h2>
            </div>

            {/* 🔥 OSTATNIE WYNIKI */}
            <div className="bg-gray-800 p-6 rounded-xl">
                <h2 className="text-xl font-semibold mb-4">
                    Ostatnie wyniki
                </h2>

                <div className="space-y-4">
                    {results.slice(-5).reverse().map(r => (
                        <div
                            key={r.id}
                            className="bg-gray-700 p-4 rounded flex justify-between"
                        >
                            <span>{r.module.name}</span>
                            <span
                                className={
                                    r.percentage >= 50
                                        ? "text-green-400"
                                        : "text-red-400"
                                }
                            >
                                {r.percentage}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
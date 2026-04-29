import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";

export default function ResultsPage() {
    const [results, setResults] = useState([]);

    useEffect(() => {
        apiFetch("/my-results").then(setResults);
    }, []);

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Twoje wyniki</h1>

            <div className="grid gap-6">
                {results.map(r => (
                    <div
                        key={r.id}
                        className="bg-gray-800 p-6 rounded-xl shadow-lg"
                    >
                        <h2 className="text-xl font-semibold mb-2">
                            {r.module.name}
                        </h2>

                        <p className={`text-lg font-bold ${
                            r.percentage >= 50
                                ? "text-green-400"
                                : "text-red-400"
                        }`}>
                            Wynik: {r.percentage}%
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
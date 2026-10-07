import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import {
    BsCalendarPlus,
    BsClock,
    BsTrash,
    BsCheckCircle
} from "react-icons/bs";

export default function AdminTutoringPage() {
    const [terms, setTerms] = useState([]);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        const data = await apiFetch("/admin/tutoring/availability");
        setTerms(data || []);
    };

    const addTerm = async () => {
        if (!startTime || !endTime) {
            alert("Podaj datę rozpoczęcia i zakończenia");
            return;
        }

        await apiFetch("/admin/tutoring/availability", {
            method: "POST",
            body: JSON.stringify({
                startTime,
                endTime
            })
        });

        setStartTime("");
        setEndTime("");
        load();
    };

    const deleteTerm = async (id) => {
        if (!window.confirm("Usunąć termin?")) return;

        await apiFetch(`/admin/tutoring/availability/${id}`, {
            method: "DELETE"
        });

        load();
    };

    const formatDate = (date) =>
        new Date(date).toLocaleString("pl-PL", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

    return (
        <div className="max-w-5xl space-y-8 text-white">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <BsCalendarPlus className="text-blue-400" />
                    Admin korepetycje
                </h1>
                <p className="text-gray-400 mt-2">
                    Dodawaj wolne terminy, które uczeń może zarezerwować.
                </p>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                <h2 className="text-xl font-bold">Dodaj dostępny termin</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-gray-400">
                            Start
                        </label>
                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-xl p-3"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-400">
                            Koniec
                        </label>
                        <input
                            type="datetime-local"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-xl p-3"
                        />
                    </div>
                </div>

                <button
                    onClick={addTerm}
                    className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold flex items-center gap-2"
                >
                    <BsCheckCircle />
                    Dodaj termin
                </button>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-bold">Wolne terminy</h2>

                {terms.length === 0 ? (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-400">
                        Brak wolnych terminów.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {terms.map(term => (
                            <div
                                key={term.id}
                                className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex justify-between items-center"
                            >
                                <div>
                                    <p className="font-semibold flex items-center gap-2">
                                        <BsClock className="text-blue-400" />
                                        {formatDate(term.startTime)}
                                    </p>

                                    <p className="text-gray-500 text-sm mt-1">
                                        Do: {formatDate(term.endTime)}
                                    </p>
                                </div>

                                <button
                                    onClick={() => deleteTerm(term.id)}
                                    className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white p-3 rounded-xl"
                                >
                                    <BsTrash />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
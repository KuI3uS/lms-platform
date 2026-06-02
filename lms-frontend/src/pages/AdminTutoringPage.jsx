import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import {
    BsCalendarPlus,
    BsClock,
    BsTrash,
    BsCheckCircle,
    BsArrowRepeat,
    BsExclamationTriangle
} from "react-icons/bs";

export default function AdminTutoringPage() {
    const [terms, setTerms] = useState([]);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await apiFetch("/admin/tutoring/availability");
            setTerms(data || []);
        } catch (e) {
            console.error(e);
            setError(e.message || "Nie udało się pobrać terminów");
        } finally {
            setLoading(false);
        }
    };

    const addTerm = async () => {
        if (!startTime || !endTime) {
            alert("Podaj datę rozpoczęcia i zakończenia");
            return;
        }

        const start = new Date(startTime);
        const end = new Date(endTime);

        if (end <= start) {
            alert("Data zakończenia musi być późniejsza niż data rozpoczęcia");
            return;
        }

        try {
            setSaving(true);

            await apiFetch("/admin/tutoring/availability", {
                method: "POST",
                body: JSON.stringify({
                    startTime,
                    endTime
                })
            });

            setStartTime("");
            setEndTime("");
            await load();
        } catch (e) {
            console.error(e);
            alert(e.message || "Nie udało się dodać terminu");
        } finally {
            setSaving(false);
        }
    };

    const deleteTerm = async (id) => {
        if (!window.confirm("Usunąć dostępny termin?")) return;

        try {
            await apiFetch(`/admin/tutoring/availability/${id}`, {
                method: "DELETE"
            });

            await load();
        } catch (e) {
            console.error(e);
            alert(e.message || "Nie udało się usunąć terminu");
        }
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

    const calculateDuration = (start, end) => {
        const diffMs = new Date(end) - new Date(start);
        const hours = diffMs / 1000 / 60 / 60;

        if (hours === 1) return "1 godzina";
        if (hours > 1 && hours < 5) return `${hours} godziny`;
        return `${hours} godzin`;
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 text-white">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        <BsCalendarPlus className="text-blue-400" />
                        Admin korepetycje
                    </h1>

                    <p className="text-gray-400 mt-2">
                        Dodajesz przedziały dostępności, np. 12:00–21:00.
                        Klient wybierze z tego konkretną godzinę lub kilka godzin.
                    </p>
                </div>

                <button
                    onClick={load}
                    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-3 rounded-xl flex items-center gap-2"
                >
                    <BsArrowRepeat />
                    Odśwież
                </button>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
                <h2 className="text-xl font-bold">Dodaj dostępność</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-gray-400">
                            Dostępny od
                        </label>

                        <input
                            type="datetime-local"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-xl p-3 outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="text-sm text-gray-400">
                            Dostępny do
                        </label>

                        <input
                            type="datetime-local"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-xl p-3 outline-none focus:border-blue-500"
                        />
                    </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-xl p-4 text-sm">
                    Przykład: ustawiasz 2026-06-20 od 12:00 do 21:00.
                    Klient na stronie publicznej będzie mógł wybrać 12:00–13:00,
                    12:00–14:00, 15:00–17:00 itd.
                </div>

                <button
                    onClick={addTerm}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                    <BsCheckCircle />
                    {saving ? "Dodawanie..." : "Dodaj dostępność"}
                </button>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-bold">Aktualne dostępności</h2>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl p-5 flex items-center gap-3">
                        <BsExclamationTriangle />
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-400">
                        Ładowanie terminów...
                    </div>
                ) : terms.length === 0 ? (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-400">
                        Brak dodanych dostępności.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {terms.map((term) => (
                            <div
                                key={term.id}
                                className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                            >
                                <div className="space-y-1">
                                    <p className="font-semibold flex items-center gap-2">
                                        <BsClock className="text-blue-400" />
                                        Od: {formatDate(term.startTime)}
                                    </p>

                                    <p className="text-gray-400 text-sm">
                                        Do: {formatDate(term.endTime)}
                                    </p>

                                    <p className="text-gray-500 text-sm">
                                        Czas dostępności: {calculateDuration(term.startTime, term.endTime)}
                                    </p>
                                </div>

                                <button
                                    onClick={() => deleteTerm(term.id)}
                                    className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white p-3 rounded-xl self-start md:self-center"
                                    title="Usuń dostępność"
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
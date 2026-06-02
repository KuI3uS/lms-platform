import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import {
    BsCalendarCheck,
    BsClock,
    BsSend,
    BsCheckCircle,
    BsXCircle
} from "react-icons/bs";

export default function TutoringPage() {
    const [availableTerms, setAvailableTerms] = useState([]);
    const [myBookings, setMyBookings] = useState([]);
    const [selectedTerm, setSelectedTerm] = useState(null);

    const [topic, setTopic] = useState("");
    const [studentMessage, setStudentMessage] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            setLoading(true);

            const [available, mine] = await Promise.all([
                apiFetch("/tutoring/available"),
                apiFetch("/tutoring/my")
            ]);

            setAvailableTerms(available || []);
            setMyBookings(mine || []);
        } catch (e) {
            console.error(e);
            alert("Nie udało się pobrać terminów korepetycji");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString("pl-PL", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString("pl-PL", {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const reserve = async () => {
        if (!selectedTerm) {
            alert("Wybierz termin");
            return;
        }

        if (!topic.trim()) {
            alert("Wpisz temat korepetycji");
            return;
        }

        try {
            await apiFetch("/tutoring/book", {
                method: "POST",
                body: JSON.stringify({
                    availabilityId: selectedTerm.id,
                    topic,
                    studentMessage
                })
            });

            alert("Termin został zarezerwowany");

            setSelectedTerm(null);
            setTopic("");
            setStudentMessage("");

            load();
        } catch (e) {
            console.error(e);
            alert(e.message || "Nie udało się zarezerwować terminu");
        }
    };

    const statusLabel = (status) => {
        if (status === "RESERVED") return "Oczekuje";
        if (status === "PAID") return "Opłacone";
        if (status === "CONFIRMED") return "Potwierdzone";
        if (status === "REJECTED") return "Odrzucone";
        if (status === "CANCELLED") return "Anulowane";
        if (status === "COMPLETED") return "Odbyte";
        return status;
    };

    const statusClass = (status) => {
        if (status === "CONFIRMED" || status === "PAID" || status === "COMPLETED") {
            return "bg-green-500/10 text-green-400 border-green-500/30";
        }

        if (status === "REJECTED" || status === "CANCELLED") {
            return "bg-red-500/10 text-red-400 border-red-500/30";
        }

        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 text-white">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <BsCalendarCheck className="text-blue-400" />
                    Korepetycje
                </h1>
                <p className="text-gray-400 mt-2">
                    Wybierz wolny termin, wpisz temat i wyślij rezerwację.
                </p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8">
                <div className="space-y-5">
                    <h2 className="text-xl font-bold">Dostępne terminy</h2>

                    {availableTerms.length === 0 ? (
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-400">
                            Brak dostępnych terminów.
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {availableTerms.map(term => {
                                const active = selectedTerm?.id === term.id;

                                return (
                                    <button
                                        key={term.id}
                                        onClick={() => setSelectedTerm(term)}
                                        className={`text-left bg-gray-900 border rounded-2xl p-5 transition ${
                                            active
                                                ? "border-blue-500 bg-blue-600/10"
                                                : "border-gray-800 hover:border-blue-600/60"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <h3 className="font-semibold text-lg">
                                                    {formatDate(term.startTime)}
                                                </h3>

                                                <p className="text-gray-400 flex items-center gap-2 mt-2">
                                                    <BsClock />
                                                    {formatTime(term.startTime)} - {formatTime(term.endTime)}
                                                </p>
                                            </div>

                                            {active ? (
                                                <BsCheckCircle className="text-blue-400 text-2xl" />
                                            ) : (
                                                <BsCalendarCheck className="text-gray-500 text-2xl" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 h-fit sticky top-8 space-y-5">
                    <h2 className="text-xl font-bold">Rezerwacja</h2>

                    {selectedTerm ? (
                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                            <p className="text-blue-300 font-semibold">
                                Wybrany termin
                            </p>
                            <p className="text-gray-300 mt-1">
                                {formatDate(selectedTerm.startTime)}
                            </p>
                            <p className="text-gray-400 text-sm">
                                {formatTime(selectedTerm.startTime)} - {formatTime(selectedTerm.endTime)}
                            </p>
                        </div>
                    ) : (
                        <div className="bg-gray-800 rounded-xl p-4 text-gray-400">
                            Wybierz termin z listy.
                        </div>
                    )}

                    <input
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="Temat, np. INF.03 SQL JOIN"
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 outline-none focus:border-blue-500"
                    />

                    <textarea
                        value={studentMessage}
                        onChange={(e) => setStudentMessage(e.target.value)}
                        placeholder="Dodatkowa wiadomość dla nauczyciela"
                        rows={5}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 outline-none focus:border-blue-500"
                    />

                    <button
                        onClick={reserve}
                        className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
                    >
                        <BsSend />
                        Zarezerwuj termin
                    </button>
                </div>
            </div>

            <div className="space-y-5">
                <h2 className="text-xl font-bold">Moje rezerwacje</h2>

                {myBookings.length === 0 ? (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-400">
                        Nie masz jeszcze żadnych rezerwacji.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {myBookings.map(booking => (
                            <div
                                key={booking.id}
                                className="bg-gray-900 border border-gray-800 rounded-2xl p-5"
                            >
                                <div className="flex justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-semibold">
                                            {booking.topic || "Bez tematu"}
                                        </h3>

                                        <p className="text-gray-400 mt-2">
                                            {formatDate(booking.startTime)}
                                        </p>

                                        <p className="text-gray-500 text-sm">
                                            {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                                        </p>
                                    </div>

                                    <span className={`h-fit border px-3 py-1 rounded-full text-sm ${statusClass(booking.status)}`}>
                                        {statusLabel(booking.status)}
                                    </span>
                                </div>

                                {booking.studentMessage && (
                                    <p className="text-gray-400 mt-4">
                                        {booking.studentMessage}
                                    </p>
                                )}

                                {booking.meetingLink && (
                                    <a
                                        href={booking.meetingLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 mt-4 text-blue-400 hover:text-blue-300"
                                    >
                                        <BsCheckCircle />
                                        Link do spotkania
                                    </a>
                                )}

                                {booking.adminComment && (
                                    <div className="mt-4 bg-gray-800 rounded-xl p-4">
                                        <p className="text-sm text-gray-500 mb-1">
                                            Komentarz nauczyciela
                                        </p>
                                        <p className="text-gray-300">
                                            {booking.adminComment}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
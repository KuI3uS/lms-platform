import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import { useFeedback } from "../context/FeedbackContext";
import {
    BsClock,
    BsTrash,
    BsCheckCircle,
    BsArrowRepeat,
    BsPerson,
    BsEnvelope,
    BsTelephone,
    BsCreditCard
} from "react-icons/bs";

export default function AdminTutoringPage() {
    const { confirm, showToast } = useFeedback();
    const [terms, setTerms] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [savingTerm, setSavingTerm] = useState(false);
    const [deletingBookingId, setDeletingBookingId] = useState(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const [termsData, bookingsData] = await Promise.all([
                apiFetch("/admin/tutoring/availability"),
                apiFetch("/admin/tutoring/bookings")
            ]);
            setTerms(termsData || []);
            setBookings(bookingsData || []);
        } catch (e) {
            console.error("Błąd panelu korepetycji:", e);
            setTerms([]);
            setBookings([]);
            setError(e.message || "Nie udało się pobrać danych korepetycji.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(load, 0);
        return () => window.clearTimeout(timer);
    }, [load]);

    const addTerm = async () => {
        if (!startTime || !endTime) {
            showToast("Podaj początek i koniec dostępności.", "warning");
            return;
        }

        if (new Date(endTime) <= new Date(startTime)) {
            showToast("Koniec musi być później niż początek.", "warning");
            return;
        }

        setSavingTerm(true);
        setError("");
        try {
            await apiFetch("/admin/tutoring/availability", {
                method: "POST",
                body: JSON.stringify({ startTime, endTime })
            });

            setStartTime("");
            setEndTime("");
            await load();
        } catch (e) {
            setError(e.message || "Nie udało się dodać dostępności.");
        } finally {
            setSavingTerm(false);
        }
    };

    const deleteTerm = async (id) => {
        if (!await confirm({ title: "Usuń dostępność", message: "Usunąć ten termin z kalendarza?", confirmLabel: "Usuń termin" })) return;

        setError("");
        try {
            await apiFetch(`/admin/tutoring/availability/${id}`, {
                method: "DELETE"
            });
            await load();
        } catch (e) {
            setError(e.message || "Nie udało się usunąć dostępności.");
        }
    };

    const updateBookingStatus = async (id, status) => {
        setError("");
        try {
            await apiFetch(`/tutoring/admin/${id}`, {
                method: "PUT",
                body: JSON.stringify({
                    status,
                    adminComment: "",
                    meetingLink: ""
                })
            });

            await load();
        } catch (e) {
            setError(e.message || "Nie udało się zmienić statusu rezerwacji.");
        }
    };

    const deleteBooking = async (booking) => {
        const description = booking.topic || "rezerwacja bez tematu";
        const accepted = await confirm({
            title: "Usuń rezerwację",
            message: `Trwale usunąć „${description}” z ${formatDate(booking.startTime)}? Tej operacji nie można cofnąć.`,
            confirmLabel: "Usuń rezerwację"
        });

        if (!accepted) return;

        setDeletingBookingId(booking.id);
        setError("");
        try {
            await apiFetch(`/admin/tutoring/bookings/${booking.id}`, {
                method: "DELETE"
            });
            setBookings(current =>
                current.filter(item => item.id !== booking.id)
            );
        } catch (e) {
            setError(e.message || "Nie udało się usunąć rezerwacji.");
        } finally {
            setDeletingBookingId(null);
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

    const formatTime = (date) =>
        new Date(date).toLocaleTimeString("pl-PL", {
            hour: "2-digit",
            minute: "2-digit"
        });

    const statusClass = (status) => {
        if (status === "PAID") return "bg-green-500/10 text-green-400 border-green-500/30";
        if (status === "CANCELLED") return "bg-red-500/10 text-red-400 border-red-500/30";
        if (status === "COMPLETED") return "bg-purple-500/10 text-purple-400 border-purple-500/30";
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
    };

    return (
        <div className="max-w-7xl mx-auto space-y-10 text-white">
            <section className="relative overflow-hidden rounded-[36px] border border-cyan-500/20 bg-gradient-to-br from-cyan-600/20 via-gray-900 to-blue-600/20 p-10">

                <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-cyan-500/20 blur-3xl" />

                <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl" />

                <div className="relative z-10 flex justify-between items-start">

                    <div>

                        <p className="uppercase tracking-[0.35em] text-cyan-300 font-black text-sm">
                            EDUHUB ADMIN
                        </p>

                        <h1 className="text-5xl font-black mt-4">
                            Korepetycje
                        </h1>

                        <p className="text-gray-400 mt-5 text-lg max-w-3xl leading-8">
                            Zarządzaj dostępnością, kontroluj rezerwacje oraz monitoruj spotkania z uczniami.
                        </p>

                    </div>

                    <button
                        onClick={load}
                        className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl px-6 py-4 hover:border-cyan-400 transition"
                    >
                        <BsArrowRepeat size={22}/>
                    </button>

                </div>

            </section>

            {error && (
                <div
                    role="alert"
                    className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 font-semibold text-red-200"
                >
                    {error}
                </div>
            )}

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-5">
                <h2 className="text-xl font-bold">Dodaj dostępność</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                        type="datetime-local"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-xl p-3"
                    />

                    <input
                        type="datetime-local"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="bg-gray-800 border border-gray-700 rounded-xl p-3"
                    />
                </div>

                <button
                    onClick={addTerm}
                    disabled={savingTerm}
                    className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold flex items-center gap-2 disabled:cursor-wait disabled:opacity-60"
                >
                    <BsCheckCircle />
                    {savingTerm ? "Dodawanie..." : "Dodaj dostępność"}
                </button>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-bold">Dostępne terminy</h2>

                {terms.length === 0 ? (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-400">
                        Brak dostępności.
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
                                    <p className="text-gray-500 text-sm">
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

            <div className="space-y-4">
                <h2 className="text-xl font-bold">Rezerwacje</h2>

                {loading ? (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-400">
                        Ładowanie...
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-400">
                        Brak rezerwacji.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {bookings.map(booking => (
                            <div
                                key={booking.id}
                                className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4"
                            >
                                <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold">
                                            {booking.topic || "Bez tematu"}
                                        </h3>

                                        <p className="text-gray-400 mt-1">
                                            {formatDate(booking.startTime)} — {formatTime(booking.endTime)}
                                        </p>

                                        <p className="text-gray-500 text-sm mt-1">
                                            {booking.hours} godz. · {booking.price} zł
                                        </p>
                                    </div>

                                    <span className={`h-fit border px-3 py-1 rounded-full text-sm ${statusClass(booking.status)}`}>
                                        {booking.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                    <p className="flex items-center gap-2 text-gray-300">
                                        <BsPerson className="text-blue-400" />
                                        {booking.guestName || "Brak imienia"}
                                    </p>

                                    <p className="flex items-center gap-2 text-gray-300">
                                        <BsEnvelope className="text-blue-400" />
                                        {booking.guestEmail || "Brak emaila"}
                                    </p>

                                    <p className="flex items-center gap-2 text-gray-300">
                                        <BsTelephone className="text-blue-400" />
                                        {booking.guestPhone || "Brak telefonu"}
                                    </p>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => updateBookingStatus(booking.id, "PAID")}
                                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl font-semibold flex items-center gap-2"
                                    >
                                        <BsCreditCard />
                                        Oznacz jako opłacone
                                    </button>

                                    <button
                                        onClick={() => updateBookingStatus(booking.id, "COMPLETED")}
                                        className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl font-semibold"
                                    >
                                        Odbyte
                                    </button>

                                    <button
                                        onClick={() => updateBookingStatus(booking.id, "CANCELLED")}
                                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl font-semibold"
                                    >
                                        Anuluj
                                    </button>

                                    {booking.status === "CANCELLED" && (
                                        <button
                                            onClick={() => deleteBooking(booking)}
                                            disabled={deletingBookingId === booking.id}
                                            className="ml-auto flex items-center gap-2 rounded-xl border border-red-500/30 bg-transparent px-4 py-2 font-semibold text-red-300 transition hover:bg-red-500/15 disabled:cursor-wait disabled:opacity-50"
                                        >
                                            <BsTrash />
                                            {deletingBookingId === booking.id
                                                ? "Usuwanie..."
                                                : "Usuń z historii"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

import { useEffect, useMemo, useState } from "react";
import {
    BsCalendarCheck,
    BsClock,
    BsPerson,
    BsEnvelope,
    BsTelephone,
    BsBook,
    BsCheckCircle,
    BsArrowLeft,
    BsCreditCard
} from "react-icons/bs";

const API_URL = "https://lms-platform-1-dcxg.onrender.com/api";

export default function TutoringBookingPage() {
    const [availability, setAvailability] = useState([]);
    const [selectedAvailability, setSelectedAvailability] = useState(null);
    const [selectedStart, setSelectedStart] = useState("");
    const [hours, setHours] = useState(1);

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        topic: ""
    });

    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(null);
    const [error, setError] = useState(null);

    const PRICE_PER_HOUR = 80;

    useEffect(() => {
        loadAvailability();
    }, []);

    const loadAvailability = async () => {
        try {
            setLoading(true);
            setError(null);

            const res = await fetch(`${API_URL}/tutoring/available`);

            if (!res.ok) {
                throw new Error("Nie udało się pobrać dostępnych terminów");
            }

            const data = await res.json();
            setAvailability(data || []);
        } catch (e) {
            console.error(e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const updateForm = (field, value) => {
        setForm(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const formatDate = (date) =>
        new Date(date).toLocaleDateString("pl-PL", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });

    const formatTime = (date) =>
        new Date(date).toLocaleTimeString("pl-PL", {
            hour: "2-digit",
            minute: "2-digit"
        });

    const toLocalDateTimeValue = (date) => {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };

    const addHours = (dateString, h) => {
        const date = new Date(dateString);
        date.setHours(date.getHours() + Number(h));
        return toLocalDateTimeValue(date);
    };

    const possibleStartTimes = useMemo(() => {
        if (!selectedAvailability) return [];

        const result = [];
        const start = new Date(selectedAvailability.startTime);
        const end = new Date(selectedAvailability.endTime);

        let current = new Date(start);

        while (current < end) {
            result.push(toLocalDateTimeValue(current));
            current.setHours(current.getHours() + 1);
        }

        return result;
    }, [selectedAvailability]);

    const selectedEnd = selectedStart ? addHours(selectedStart, hours) : "";

    const canReserve =
        form.name.trim() &&
        form.email.trim() &&
        form.phone.trim() &&
        form.topic.trim() &&
        selectedStart &&
        selectedEnd;

    const reserve = async () => {
        if (!canReserve) {
            alert("Uzupełnij wszystkie dane i wybierz termin");
            return;
        }

        const availabilityEnd = new Date(selectedAvailability.endTime);
        const end = new Date(selectedEnd);

        if (end > availabilityEnd) {
            alert("Wybrana liczba godzin wychodzi poza dostępny termin");
            return;
        }

        try {
            setError(null);

            const res = await fetch(`${API_URL}/tutoring/book`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    topic: form.topic,
                    startTime: selectedStart,
                    endTime: selectedEnd
                })
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Nie udało się utworzyć rezerwacji");
            }

            const data = await res.json();
            setBooking(data);
        } catch (e) {
            console.error(e);
            setError(e.message);
        }
    };

    if (booking) {
        return (
            <div className="min-h-screen bg-gray-950 text-white p-8">
                <div className="max-w-3xl mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-8 space-y-5">
                    <BsCheckCircle className="text-green-400 text-5xl" />

                    <h1 className="text-3xl font-bold">
                        Rezerwacja utworzona
                    </h1>

                    <p className="text-gray-400">
                        Termin został wstępnie zarezerwowany. Następny krok to podpięcie płatności online.
                    </p>

                    <div className="bg-gray-800 rounded-xl p-5 space-y-2">
                        <p>
                            <strong>Termin:</strong>{" "}
                            {formatDate(booking.startTime)}, {formatTime(booking.startTime)}–{formatTime(booking.endTime)}
                        </p>

                        <p>
                            <strong>Temat:</strong> {booking.topic}
                        </p>

                        <p>
                            <strong>Czas:</strong> {booking.hours} godz.
                        </p>

                        <p>
                            <strong>Kwota:</strong> {booking.price} zł
                        </p>

                        <p>
                            <strong>Status:</strong> {booking.status}
                        </p>
                    </div>

                    <div className="bg-gray-800 rounded-2xl p-6 space-y-5 text-center">
                        <h2 className="text-2xl font-bold">
                            Zapłać wygodnie
                        </h2>

                        <p className="text-gray-400">
                            Zeskanuj kod QR telefonem albo kliknij przycisk poniżej,
                            aby przejść do płatności Revolut.
                        </p>

                        <div className="flex justify-center">
                            <img
                                src="image/80zl.png"
                                alt="Kod QR płatności Revolut"
                                className="max-w-xs rounded-2xl border border-gray-700"
                            />
                        </div>

                        <a
                            href="https://checkout.revolut.com/pay/334e96d4-687b-46d9-8f1b-b5452be7d555"
                            target="_blank"
                            rel="noreferrer"
                            className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold inline-block"
                        >
                            Przejdź do płatności
                        </a>
                    </div>

                    <button
                        onClick={() => window.location.href = "/"}
                        className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl font-semibold"
                    >
                        Wróć na stronę główną
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <button
                        onClick={() => window.location.href = "/"}
                        className="text-gray-400 hover:text-white flex items-center gap-2 mb-6"
                    >
                        <BsArrowLeft />
                        Wróć
                    </button>

                    <h1 className="text-4xl font-bold flex items-center gap-3">
                        <BsCalendarCheck className="text-blue-400" />
                        Rezerwacja korepetycji
                    </h1>

                    <p className="text-gray-400 mt-3">
                        Wybierz dostępny dzień, godzinę rozpoczęcia, liczbę godzin i uzupełnij dane.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl p-5">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-8">
                    <div className="space-y-5">
                        <h2 className="text-2xl font-bold">Dostępne dni</h2>

                        {loading ? (
                            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-400">
                                Ładowanie terminów...
                            </div>
                        ) : availability.length === 0 ? (
                            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-gray-400">
                                Brak dostępnych terminów.
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {availability.map(term => {
                                    const active = selectedAvailability?.id === term.id;

                                    return (
                                        <button
                                            key={term.id}
                                            onClick={() => {
                                                setSelectedAvailability(term);
                                                setSelectedStart("");
                                                setHours(1);
                                            }}
                                            className={`text-left bg-gray-900 border rounded-2xl p-5 transition ${
                                                active
                                                    ? "border-blue-500 bg-blue-600/10"
                                                    : "border-gray-800 hover:border-blue-600/60"
                                            }`}
                                        >
                                            <h3 className="text-lg font-semibold">
                                                {formatDate(term.startTime)}
                                            </h3>

                                            <p className="text-gray-400 flex items-center gap-2 mt-2">
                                                <BsClock />
                                                {formatTime(term.startTime)}–{formatTime(term.endTime)}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 h-fit sticky top-8 space-y-5">
                        <h2 className="text-2xl font-bold">Szczegóły</h2>

                        {selectedAvailability ? (
                            <>
                                <div>
                                    <label className="text-sm text-gray-400">
                                        Godzina rozpoczęcia
                                    </label>

                                    <select
                                        value={selectedStart}
                                        onChange={(e) => setSelectedStart(e.target.value)}
                                        className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-xl p-3 outline-none focus:border-blue-500"
                                    >
                                        <option value="">Wybierz godzinę</option>

                                        {possibleStartTimes.map(time => (
                                            <option key={time} value={time}>
                                                {formatTime(time)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-sm text-gray-400">
                                        Liczba godzin
                                    </label>

                                    <select
                                        value={hours}
                                        onChange={(e) => setHours(Number(e.target.value))}
                                        className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-xl p-3 outline-none focus:border-blue-500"
                                    >
                                        <option value={1}>1 godzina</option>
                                        <option value={2}>2 godziny</option>
                                        <option value={3}>3 godziny</option>
                                        <option value={4}>4 godziny</option>
                                    </select>
                                </div>

                                {selectedStart && (
                                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-blue-300">
                                        {formatTime(selectedStart)}–{formatTime(selectedEnd)} · {hours * PRICE_PER_HOUR} zł
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="bg-gray-800 rounded-xl p-4 text-gray-400">
                                Najpierw wybierz dostępny dzień z kalendarza.
                            </div>
                        )}

                        <div className="space-y-3 pt-3">
                            <div className="relative">
                                <BsPerson className="absolute left-3 top-4 text-gray-500" />
                                <input
                                    value={form.name}
                                    onChange={(e) => updateForm("name", e.target.value)}
                                    placeholder="Imię i nazwisko"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 pl-10 outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="relative">
                                <BsEnvelope className="absolute left-3 top-4 text-gray-500" />
                                <input
                                    value={form.email}
                                    onChange={(e) => updateForm("email", e.target.value)}
                                    placeholder="Email"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 pl-10 outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="relative">
                                <BsTelephone className="absolute left-3 top-4 text-gray-500" />
                                <input
                                    value={form.phone}
                                    onChange={(e) => updateForm("phone", e.target.value)}
                                    placeholder="Telefon"
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 pl-10 outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="relative">
                                <BsBook className="absolute left-3 top-4 text-gray-500" />
                                <textarea
                                    value={form.topic}
                                    onChange={(e) => updateForm("topic", e.target.value)}
                                    placeholder="Temat, np. INF.03 SQL JOIN"
                                    rows={4}
                                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 pl-10 outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <button
                            onClick={reserve}
                            className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl py-3 font-semibold flex items-center justify-center gap-2"
                        >
                            <BsCreditCard />
                            Przejdź do rezerwacji
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
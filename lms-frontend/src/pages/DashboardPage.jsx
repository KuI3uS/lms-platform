import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import {
    BsBook,
    BsClipboardCheck,
    BsClockHistory,
    BsExclamationCircle,
    BsChatLeftText,
    BsPlayFill,
    BsLightningChargeFill,
    BsTrophyFill,
    BsFire,
    BsArrowRight,
    BsStars
} from "react-icons/bs";

export default function DashboardPage() {
    const navigate = useNavigate();

    const [courses, setCourses] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            const [coursesData, submissionsData, resultsData] = await Promise.all([
                apiFetch("/courses"),
                apiFetch("/submissions/my").catch(() => []),
                apiFetch("/my-results").catch(() => [])
            ]);

            setCourses(coursesData || []);
            setSubmissions(submissionsData || []);
            setResults(resultsData || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const checked = submissions.filter(s => s.status === "CHECKED").length;
    const toFix = submissions.filter(s => s.status === "TO_FIX").length;
    const waiting = submissions.filter(s => s.status === "NEW").length;
    const lastSubmissions = submissions.slice(0, 4);
    const firstCourse = courses[0];

    const statusStyle = (status) => {
        if (status === "CHECKED") return "bg-green-500/10 text-green-400 border-green-500/30";
        if (status === "TO_FIX") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-10 text-white">

            <section className="relative overflow-hidden rounded-[2rem] border border-blue-500/20 bg-gradient-to-br from-blue-600/30 via-gray-900 to-purple-700/20 p-8 shadow-2xl">
                <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />

                <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
                    <div>
                        <p className="text-blue-300 font-semibold mb-2 flex items-center gap-2">
                            <BsStars />
                            Panel nauki
                        </p>

                        <h1 className="text-4xl md:text-5xl font-black">
                            Kontynuuj swoją ścieżkę
                        </h1>

                        <p className="text-gray-300 mt-4 max-w-2xl text-lg">
                            Ucz się krok po kroku, rozwiązuj zadania, wysyłaj projekty
                            i buduj realne umiejętności do INF.02, INF.03, matury i programowania.
                        </p>
                    </div>

                    <div className="bg-gray-950/70 border border-white/10 rounded-3xl p-6 min-w-[280px]">
                        <p className="text-gray-400 text-sm mb-2">Twój status</p>

                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                <BsLightningChargeFill size={28} />
                            </div>

                            <div>
                                <h2 className="text-2xl font-black">Poziom 1</h2>
                                <p className="text-gray-400 text-sm">Start nauki</p>
                            </div>
                        </div>

                        <div className="mt-5">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-400">XP</span>
                                <span className="font-bold">0 / 100</span>
                            </div>

                            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-3 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full w-[0%]" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <StatCard icon={<BsBook />} label="Kursy" value={courses.length} color="text-blue-400" />
                <StatCard icon={<BsClipboardCheck />} label="Wysłane prace" value={submissions.length} color="text-purple-400" />
                <StatCard icon={<BsClockHistory />} label="Czekają" value={waiting} color="text-yellow-400" />
                <StatCard icon={<BsExclamationCircle />} label="Do poprawy" value={toFix} color="text-red-400" />
            </section>

            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
                        <div className="flex items-center justify-between gap-4 mb-5">
                            <div>
                                <h2 className="text-2xl font-black">Kontynuuj naukę</h2>
                                <p className="text-gray-400 mt-1">
                                    Wróć do ostatnio wybranego kursu albo rozpocznij nową ścieżkę.
                                </p>
                            </div>

                            <BsPlayFill className="text-blue-400" size={34} />
                        </div>

                        {firstCourse ? (
                            <div className="rounded-3xl bg-gradient-to-br from-gray-800 to-gray-950 border border-gray-700 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
                                <div>
                                    <p className="text-blue-400 text-sm font-semibold mb-2">
                                        Aktywna ścieżka
                                    </p>

                                    <h3 className="text-2xl font-bold">
                                        {firstCourse.title || firstCourse.name}
                                    </h3>

                                    <p className="text-gray-400 mt-2 max-w-xl">
                                        {firstCourse.description || "Przejdź do modułów i rozpocznij naukę krok po kroku."}
                                    </p>
                                </div>

                                <button
                                    onClick={() => navigate(`/modules/${firstCourse.id}`)}
                                    className="bg-blue-600 hover:bg-blue-700 px-6 py-4 rounded-2xl font-bold flex items-center gap-2 justify-center"
                                >
                                    Kontynuuj
                                    <BsArrowRight />
                                </button>
                            </div>
                        ) : (
                            <div className="bg-gray-800 rounded-2xl p-5 text-gray-400">
                                Brak dostępnych kursów.
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black">Ostatnie prace</h2>
                            <span className="text-sm text-gray-500">{submissions.length} łącznie</span>
                        </div>

                        {lastSubmissions.length === 0 ? (
                            <div className="text-gray-400 bg-gray-800 rounded-2xl p-5">
                                Nie wysłałeś jeszcze żadnej pracy.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {lastSubmissions.map(s => (
                                    <SubmissionCard key={s.id} submission={s} statusStyle={statusStyle} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <aside className="space-y-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
                        <h2 className="text-2xl font-black mb-5">Osiągnięcia</h2>

                        <div className="space-y-3">
                            <Achievement icon={<BsFire />} title="Pierwszy dzień" description="Rozpocznij naukę." active />
                            <Achievement icon={<BsTrophyFill />} title="Pierwsza praca" description="Wyślij pierwsze zadanie." active={submissions.length > 0} />
                            <Achievement icon={<BsClipboardCheck />} title="Sprawdzone" description="Otrzymaj ocenę od nauczyciela." active={checked > 0} />
                        </div>
                    </div>

                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6">
                        <h2 className="text-2xl font-black mb-5">Podsumowanie</h2>

                        <div className="space-y-3">
                            <SummaryRow label="Sprawdzone" value={checked} color="text-green-400" />
                            <SummaryRow label="Czekają" value={waiting} color="text-blue-400" />
                            <SummaryRow label="Do poprawy" value={toFix} color="text-yellow-400" />
                            <SummaryRow label="Testy" value={results.length} color="text-purple-400" />
                        </div>
                    </div>
                </aside>
            </section>
        </div>
    );
}

function StatCard({ icon, label, value, color }) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-5 hover:border-blue-500/40 transition">
            <div className="flex items-center justify-between">
                <p className="text-gray-400">{label}</p>
                <div className={color}>{icon}</div>
            </div>

            <h2 className="text-4xl font-black mt-4">{value}</h2>
        </div>
    );
}

function SubmissionCard({ submission, statusStyle }) {
    return (
        <div className="bg-gray-800 rounded-2xl p-5 border border-gray-700/60">
            <div className="flex justify-between gap-4">
                <div>
                    <h3 className="font-bold text-lg">
                        {submission.lesson?.title || "Brak lekcji"}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                        Wysłano: {submission.submittedAt?.replace("T", " ").slice(0, 16)}
                    </p>
                </div>

                <span className={`h-fit border px-3 py-1 rounded-full text-sm ${statusStyle(submission.status)}`}>
                    {submission.status}
                </span>
            </div>

            {submission.grade && (
                <p className="mt-3 text-green-400 font-semibold">
                    Ocena: {submission.grade}
                </p>
            )}

            {submission.teacherComment && (
                <div className="mt-4 bg-gray-900 rounded-xl p-4 border border-gray-700">
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                        <BsChatLeftText />
                        <span className="font-semibold">Komentarz nauczyciela</span>
                    </div>

                    <p className="text-gray-300 whitespace-pre-line">
                        {submission.teacherComment}
                    </p>
                </div>
            )}
        </div>
    );
}

function SummaryRow({ label, value, color }) {
    return (
        <div className="flex justify-between bg-gray-800 p-4 rounded-2xl">
            <span className="text-gray-400">{label}</span>
            <span className={`${color} font-black`}>{value}</span>
        </div>
    );
}

function Achievement({ icon, title, description, active }) {
    return (
        <div className={`rounded-2xl border p-4 flex gap-4 ${
            active
                ? "bg-blue-500/10 border-blue-500/30"
                : "bg-gray-800/60 border-gray-700 opacity-60"
        }`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                active ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400"
            }`}>
                {icon}
            </div>

            <div>
                <h3 className="font-bold">{title}</h3>
                <p className="text-sm text-gray-400 mt-1">{description}</p>
            </div>
        </div>
    );
}
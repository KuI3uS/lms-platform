import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import {
    BsBook,
    BsClipboardCheck,
    BsClockHistory,
    BsPatchCheck,
    BsExclamationCircle,
    BsChatLeftText
} from "react-icons/bs";

export default function DashboardPage() {
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
                apiFetch("/submissions/my"),
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

    const lastSubmissions = submissions.slice(0, 5);

    const statusStyle = (status) => {
        if (status === "CHECKED") return "bg-green-500/10 text-green-400 border-green-500/30";
        if (status === "TO_FIX") return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
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
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-gray-400 mt-1">
                    Podsumowanie Twojej nauki, prac i ocen.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-gray-400">Kursy</p>
                        <BsBook className="text-blue-400" />
                    </div>
                    <h2 className="text-3xl font-bold mt-3">{courses.length}</h2>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-gray-400">Wysłane prace</p>
                        <BsClipboardCheck className="text-purple-400" />
                    </div>
                    <h2 className="text-3xl font-bold mt-3">{submissions.length}</h2>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-gray-400">Do sprawdzenia</p>
                        <BsClockHistory className="text-yellow-400" />
                    </div>
                    <h2 className="text-3xl font-bold mt-3">{waiting}</h2>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                    <div className="flex items-center justify-between">
                        <p className="text-gray-400">Do poprawy</p>
                        <BsExclamationCircle className="text-red-400" />
                    </div>
                    <h2 className="text-3xl font-bold mt-3">{toFix}</h2>
                </div>

            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                <div className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Ostatnie prace</h2>
                        <span className="text-sm text-gray-500">
                            {submissions.length} łącznie
                        </span>
                    </div>

                    {lastSubmissions.length === 0 ? (
                        <div className="text-gray-400 bg-gray-800 rounded-xl p-5">
                            Nie wysłałeś jeszcze żadnej pracy.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {lastSubmissions.map(s => (
                                <div
                                    key={s.id}
                                    className="bg-gray-800 rounded-xl p-5 border border-gray-700/60"
                                >
                                    <div className="flex justify-between gap-4">
                                        <div>
                                            <h3 className="font-semibold text-lg">
                                                {s.lesson?.title || "Brak lekcji"}
                                            </h3>

                                            <p className="text-sm text-gray-500 mt-1">
                                                Wysłano: {s.submittedAt?.replace("T", " ").slice(0, 16)}
                                            </p>
                                        </div>

                                        <span className={`h-fit border px-3 py-1 rounded-full text-sm ${statusStyle(s.status)}`}>
                                            {s.status}
                                        </span>
                                    </div>

                                    {s.grade && (
                                        <p className="mt-3 text-green-400 font-semibold">
                                            Ocena: {s.grade}
                                        </p>
                                    )}

                                    {s.teacherComment && (
                                        <div className="mt-4 bg-gray-900 rounded-xl p-4 border border-gray-700">
                                            <div className="flex items-center gap-2 text-blue-400 mb-2">
                                                <BsChatLeftText />
                                                <span className="font-semibold">Komentarz nauczyciela</span>
                                            </div>
                                            <p className="text-gray-300 whitespace-pre-line">
                                                {s.teacherComment}
                                            </p>
                                        </div>
                                    )}

                                    <details className="mt-4">
                                        <summary className="cursor-pointer text-blue-400 hover:text-blue-300">
                                            Pokaż odpowiedzi
                                        </summary>

                                        <div className="mt-4 space-y-3">
                                            {s.answers?.map((a, index) => (
                                                <div key={a.id} className="bg-gray-900 rounded-xl p-4">
                                                    <div className="flex justify-between">
                                                        <h4 className="font-semibold text-yellow-400">
                                                            Zadanie {index + 1}
                                                        </h4>

                                                        <span className={a.correct ? "text-green-400" : "text-red-400"}>
                                                            {a.correct ? "Poprawne" : "Błędne"}
                                                        </span>
                                                    </div>

                                                    <p className="text-gray-300 mt-2 whitespace-pre-line">
                                                        {a.taskContent}
                                                    </p>

                                                    <p className="text-sm text-blue-400 mt-4">
                                                        Twoja odpowiedź:
                                                    </p>
                                                    <pre className="bg-black rounded-lg p-3 text-green-400 whitespace-pre-wrap">
                                                        {a.studentAnswer || "Brak odpowiedzi"}
                                                    </pre>

                                                    <p className="text-sm text-gray-400 mt-4">
                                                        Poprawna odpowiedź:
                                                    </p>
                                                    <pre className="bg-black rounded-lg p-3 text-gray-300 whitespace-pre-wrap">
                                                        {a.expectedAnswer || "Brak"}
                                                    </pre>
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                    <h2 className="text-xl font-bold">Podsumowanie</h2>

                    <div className="space-y-3">
                        <div className="flex justify-between bg-gray-800 p-4 rounded-xl">
                            <span className="text-gray-400">Sprawdzone</span>
                            <span className="text-green-400 font-bold">{checked}</span>
                        </div>

                        <div className="flex justify-between bg-gray-800 p-4 rounded-xl">
                            <span className="text-gray-400">Czekają</span>
                            <span className="text-blue-400 font-bold">{waiting}</span>
                        </div>

                        <div className="flex justify-between bg-gray-800 p-4 rounded-xl">
                            <span className="text-gray-400">Do poprawy</span>
                            <span className="text-yellow-400 font-bold">{toFix}</span>
                        </div>

                        <div className="flex justify-between bg-gray-800 p-4 rounded-xl">
                            <span className="text-gray-400">Testy</span>
                            <span className="text-purple-400 font-bold">{results.length}</span>
                        </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-blue-300 text-sm">
                        Tu będą pojawiać się Twoje oceny, komentarze nauczyciela i statusy prac.
                    </div>
                </div>

            </div>
        </div>
    );
}
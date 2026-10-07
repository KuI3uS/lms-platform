import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import { useFeedback } from "../context/FeedbackContext";

import {
    BsPersonCircle,
    BsArrowRight
} from "react-icons/bs";

export default function AdminSubmissionsPage() {
    const { confirm, showToast } = useFeedback();
    const [submissions, setSubmissions] = useState([]);
    const [selected, setSelected] = useState(null);
    const [className, setClassName] = useState("");
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("");

    useEffect(() => {
        let active = true;
        apiFetch("/admin/submissions").then((data) => {
            if (active) setSubmissions(data || []);
        });
        return () => {
            active = false;
        };
    }, []);

    const load = async () => {
        const params = new URLSearchParams();

        if (className.trim()) params.append("className", className);
        if (email.trim()) params.append("email", email);
        if (status.trim()) params.append("status", status);

        const query = params.toString();
        const data = await apiFetch(`/admin/submissions${query ? "?" + query : ""}`);

        setSubmissions(data || []);
    };
    const deleteSubmission = async (id) => {
        const confirmed = await confirm({ title: "Usuń pracę", message: "Czy na pewno chcesz trwale usunąć tę pracę ucznia?", confirmLabel: "Usuń pracę" });
        if (!confirmed) return;

        try {
            await apiFetch(`/admin/submissions/${id}`, {
                method: "DELETE"
            });

            setSubmissions(prev => prev.filter(s => s.id !== id));
            setSelected(null);

        } catch (e) {
            console.error(e);
            showToast("Nie udało się usunąć pracy.", "error");
        }
    };

    const save = async () => {
        await apiFetch(`/admin/submissions/${selected.id}`, {
            method: "PUT",
            body: JSON.stringify({
                status: selected.status,
                grade: selected.grade,
                teacherComment: selected.teacherComment
            })
        });

        showToast("Ocena i komentarz zostały zapisane.", "success");
        setSelected(null);
        load();
    };


    return (

        <div className="space-y-8">

            {/* HERO */}

            <section className="relative overflow-hidden rounded-[36px] border border-blue-500/20 bg-gradient-to-br from-blue-600/20 via-gray-900 to-purple-600/20 p-10">

                <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl"/>

                <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl"/>

                <div className="relative z-10">

                    <p className="uppercase tracking-[0.35em] text-blue-300 font-black text-sm">

                        EDUHUB ADMIN

                    </p>

                    <h1 className="text-5xl font-black mt-4">

                        Sprawdzanie prac uczniów

                    </h1>

                    <p className="text-gray-400 mt-5 text-lg max-w-3xl leading-8">

                        Oceniaj rozwiązania, wystawiaj oceny, dodawaj komentarze
                        i śledź postępy uczniów w czasie rzeczywistym.

                    </p>

                    <div className="grid md:grid-cols-3 gap-5 mt-10">

                        <div className="rounded-3xl bg-black/20 p-6">

                            <p className="text-gray-400">
                                Wszystkich prac
                            </p>

                            <h2 className="text-5xl font-black mt-3">

                                {submissions.length}

                            </h2>

                        </div>

                        <div className="rounded-3xl bg-black/20 p-6">

                            <p className="text-gray-400">
                                Do sprawdzenia
                            </p>

                            <h2 className="text-5xl font-black mt-3">

                                {submissions.filter(s=>s.status==="NEW").length}

                            </h2>

                        </div>

                        <div className="rounded-3xl bg-black/20 p-6">

                            <p className="text-gray-400">
                                Sprawdzone
                            </p>

                            <h2 className="text-5xl font-black mt-3">

                                {submissions.filter(s=>s.status==="CHECKED").length}

                            </h2>

                        </div>

                    </div>

                </div>

            </section>



            <div className="grid xl:grid-cols-[430px_1fr] gap-8">

            <div className="space-y-4">
                <h1 className="text-3xl font-bold">Prace uczniów</h1>

                <div
                    className="
        rounded-[28px]
        bg-white/5
        backdrop-blur-xl
        border
        border-white/10
        p-6
        space-y-4
    "
                >

                    <input
                        placeholder="Klasa, np. 3TIA"
                        value={className}
                        onChange={e => setClassName(e.target.value)}
                        className="
w-full
bg-black/20
border
border-white/10
rounded-2xl
px-4
py-3
outline-none
focus:border-blue-500
transition
"
                    />

                    <input
                        placeholder="Email ucznia"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="
w-full
bg-black/20
border
border-white/10
rounded-2xl
px-4
py-3
outline-none
focus:border-blue-500
transition
"
                    />

                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="
w-full
bg-black/20
border
border-white/10
rounded-2xl
px-4
py-3
outline-none
focus:border-blue-500
transition
"
                    >
                        <option value="">Wszystkie statusy</option>
                        <option value="NEW">NEW</option>
                        <option value="CHECKED">CHECKED</option>
                        <option value="TO_FIX">TO_FIX</option>
                    </select>

                    <button
                        onClick={load}
                        className="
w-full
rounded-2xl
bg-gradient-to-r
from-blue-600
to-cyan-500
py-3
font-bold
hover:scale-[1.02]
transition
shadow-lg
"
                    >
                        Szukaj
                    </button>

                </div>
                {/* =========================================== */}
                {/* LISTA PRAC */}
                {/* =========================================== */}

                <div className="space-y-5">

                    {submissions.length === 0 && (

                        <div className="rounded-[30px] border border-white/10 bg-white/5 backdrop-blur-xl p-12 text-center">

                            <div className="text-6xl mb-6">
                                📚
                            </div>

                            <h2 className="text-2xl font-black">
                                Brak prac
                            </h2>

                            <p className="text-gray-400 mt-3">
                                Żaden uczeń nie wysłał jeszcze rozwiązania.
                            </p>

                        </div>

                    )}

                    {submissions.map((submission) => {

                        const active =
                            selected?.id === submission.id;

                        const lesson =
                            submission.lesson?.title || "Nieznana lekcja";

                        const user =
                            submission.user?.email || "Nieznany użytkownik";

                        const grade =
                            submission.grade || "-";

                        const status =
                            submission.status || "NEW";

                        const statusStyle = {

                            NEW: {
                                bg: "bg-blue-500/20",
                                text: "text-blue-300",
                                label: "Nowe"
                            },

                            CHECKED: {
                                bg: "bg-green-500/20",
                                text: "text-green-300",
                                label: "Sprawdzone"
                            },

                            TO_FIX: {
                                bg: "bg-orange-500/20",
                                text: "text-orange-300",
                                label: "Do poprawy"
                            }

                        };

                        const badge =
                            statusStyle[status] || statusStyle.NEW;

                        return (

                            <button

                                key={submission.id}

                                onClick={() => setSelected(submission)}

                                className={`
                    group
                    relative
                    w-full
                    overflow-hidden
                    rounded-[28px]
                    border
                    transition-all
                    duration-300
                    backdrop-blur-xl
                    text-left

                    ${
                                    active
                                        ? "border-blue-500 bg-blue-500/10 shadow-[0_0_50px_rgba(59,130,246,0.20)] scale-[1.01]"
                                        : "border-white/10 bg-white/[0.04] hover:border-blue-400/50 hover:bg-white/[0.06] hover:-translate-y-1"
                                }
                `}
                            >

                                {/* Glow */}

                                <div className="absolute -right-16 -top-16 w-40 h-40 rounded-full bg-blue-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition" />

                                <div className="relative p-7">

                                    {/* GÓRA */}

                                    <div className="flex justify-between items-start">

                                        <div className="flex items-center gap-4">

                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-2xl shadow-lg">

                                                <BsPersonCircle size={34}/>

                                            </div>

                                            <div>

                                                <h2 className="font-black text-xl">

                                                    {user}

                                                </h2>

                                                <p className="text-gray-400 mt-1">

                                                    {lesson}

                                                </p>

                                            </div>

                                        </div>

                                        <div
                                            className={`
                                px-4
                                py-2
                                rounded-full
                                text-sm
                                font-bold
                                ${badge.bg}
                                ${badge.text}
                            `}
                                        >

                                            {badge.label}

                                        </div>

                                    </div>

                                    {/* ŚRODEK */}

                                    <div className="grid grid-cols-3 gap-5 mt-8">

                                        <div className="rounded-2xl bg-black/20 border border-white/5 p-4">

                                            <p className="text-xs uppercase tracking-wider text-gray-500">

                                                Ocena

                                            </p>

                                            <p className="text-3xl font-black mt-2">

                                                {grade}

                                            </p>

                                        </div>

                                        <div className="rounded-2xl bg-black/20 border border-white/5 p-4">

                                            <p className="text-xs uppercase tracking-wider text-gray-500">

                                                Zadania

                                            </p>

                                            <p className="text-3xl font-black mt-2">

                                                {submission.answers?.length ?? 0}

                                            </p>

                                        </div>

                                        <div className="rounded-2xl bg-black/20 border border-white/5 p-4">

                                            <p className="text-xs uppercase tracking-wider text-gray-500">

                                                Data

                                            </p>

                                            <p className="font-bold mt-2">

                                                {submission.submittedAt?.split("T")[0]}

                                            </p>

                                        </div>

                                    </div>

                                    {/* DÓŁ */}

                                    <div className="flex justify-between items-center mt-8">

                                        <div className="flex items-center gap-2 text-sm text-gray-500">

                                            <div className="w-2 h-2 rounded-full bg-green-400" />

                                            Kliknij aby otworzyć

                                        </div>

                                        <div
                                            className="
                                w-11
                                h-11
                                rounded-2xl
                                bg-blue-500/20
                                text-blue-300
                                flex
                                items-center
                                justify-center
                                group-hover:translate-x-1
                                transition
                            "
                                        >

                                            <BsArrowRight />
                                        </div>

                                    </div>

                                </div>

                            </button>

                        );

                    })}

                </div>
            </div>

                <div
                    className="
    rounded-[32px]
    border
    border-white/10
    bg-white/5
    backdrop-blur-xl
    p-8
    min-h-[700px]
"
                >
                {!selected ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-32">

                        <div className="text-7xl mb-6">
                            🎯
                        </div>

                        <h2 className="text-3xl font-black">

                            Wybierz pracę

                        </h2>

                        <p className="text-gray-400 mt-4 max-w-md">

                            Kliknij kartę po lewej stronie,
                            aby rozpocząć sprawdzanie rozwiązania.

                        </p>

                    </div>
                ) : (
                    <div className="space-y-5">

                        <h2 className="text-2xl font-bold">
                            {selected.lesson?.title}
                        </h2>

                        <p className="text-gray-400">
                            Uczeń: {selected.user?.email}
                        </p>

                        <div className="space-y-4">
                            {selected.answers?.map((a, index) => (
                                <div
                                    key={a.id}
                                    className="rounded-3xl border border-white/10 bg-black/20 p-6"
                                >

                                    <h3 className="text-yellow-400 font-semibold">
                                        Zadanie {index + 1}
                                    </h3>

                                    <p className="mt-2 text-gray-300">
                                        {a.taskContent}
                                    </p>

                                    <p className="mt-3 text-blue-400">
                                        Odpowiedź ucznia:
                                    </p>

                                    <pre className="bg-black p-3 rounded whitespace-pre-wrap text-green-400">
                                        {a.studentAnswer || "Brak odpowiedzi"}
                                    </pre>

                                    <p className="mt-3 text-gray-400">
                                        Poprawna odpowiedź:
                                    </p>

                                    <pre className="bg-black p-3 rounded whitespace-pre-wrap text-gray-300">
                                        {a.expectedAnswer || "Brak"}
                                    </pre>

                                    <p className={a.correct ? "text-green-400" : "text-red-400"}>
                                        {a.correct ? "Poprawne" : "Błędne"}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <select
                            value={selected.status || "NEW"}
                            onChange={e => setSelected({
                                ...selected,
                                status: e.target.value
                            })}
                            className="
w-full
rounded-2xl
bg-black/20
border
border-white/10
px-4
py-4
focus:border-blue-500
transition
"
                        >
                            <option value="NEW">NEW</option>
                            <option value="CHECKED">CHECKED</option>
                            <option value="TO_FIX">TO_FIX</option>
                        </select>

                        <input
                            placeholder="Ocena, np. 5 albo 80%"
                            value={selected.grade || ""}
                            onChange={e => setSelected({
                                ...selected,
                                grade: e.target.value
                            })}
                            className="
w-full
rounded-2xl
bg-black/20
border
border-white/10
px-4
py-4
focus:border-blue-500
transition
"
                        />

                        <textarea
                            placeholder="Komentarz nauczyciela"
                            value={selected.teacherComment || ""}
                            onChange={e => setSelected({
                                ...selected,
                                teacherComment: e.target.value
                            })}
                            className="
w-full
rounded-2xl
bg-black/20
border
border-white/10
px-4
py-4
focus:border-blue-500
transition
"
                            rows={5}
                        />

                        <button
                            onClick={save}
                            className="
w-full
rounded-2xl
py-4
font-bold
bg-gradient-to-r
from-green-500
to-emerald-400
hover:scale-[1.02]
transition
shadow-xl
"
                        >
                            Zapisz sprawdzenie
                        </button>

                        <button
                            onClick={() => deleteSubmission(selected.id)}
                            className="
w-full
rounded-2xl
py-4
font-bold
bg-red-500/20
border
border-red-500/30
text-red-300
hover:bg-red-500/30
transition
"
                        >
                            Usuń
                        </button>

                    </div>
                )}
            </div>
            </div>

        </div>

    );

}

import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";

export default function AdminSubmissionsPage() {
    const [submissions, setSubmissions] = useState([]);
    const [selected, setSelected] = useState(null);
    const [className, setClassName] = useState("");
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("");

    useEffect(() => {
        load();
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
        const confirmed = window.confirm("Czy na pewno chcesz usunąć tę pracę?");
        if (!confirmed) return;

        try {
            await apiFetch(`/admin/submissions/${id}`, {
                method: "DELETE"
            });

            setSubmissions(prev => prev.filter(s => s.id !== id));
            setSelected(null);

        } catch (e) {
            console.error(e);
            alert("Nie udało się usunąć pracy");
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

        alert("Zapisano ocenę");
        setSelected(null);
        load();
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 text-white">

            <div className="space-y-4">
                <h1 className="text-3xl font-bold">Prace uczniów</h1>

                <div className="bg-gray-800 p-4 rounded-xl grid grid-cols-1 md:grid-cols-4 gap-3">

                    <input
                        placeholder="Klasa, np. 3TIA"
                        value={className}
                        onChange={e => setClassName(e.target.value)}
                        className="bg-gray-900 p-3 rounded"
                    />

                    <input
                        placeholder="Email ucznia"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="bg-gray-900 p-3 rounded"
                    />

                    <select
                        value={status}
                        onChange={e => setStatus(e.target.value)}
                        className="bg-gray-900 p-3 rounded"
                    >
                        <option value="">Wszystkie statusy</option>
                        <option value="NEW">NEW</option>
                        <option value="CHECKED">CHECKED</option>
                        <option value="TO_FIX">TO_FIX</option>
                    </select>

                    <button
                        onClick={load}
                        className="bg-blue-600 px-4 py-2 rounded font-semibold"
                    >
                        Szukaj
                    </button>

                </div>

                {submissions.map(s => (
                    <div
                        key={s.id}
                        onClick={() => setSelected(s)}
                        className="bg-gray-800 p-5 rounded-xl cursor-pointer hover:bg-gray-700"
                    >
                        <div className="flex justify-between">
                            <h2 className="font-semibold">
                                {s.lesson?.title || "Brak lekcji"}
                            </h2>

                            <span className="text-sm bg-blue-600 px-3 py-1 rounded">
                                {s.status}
                            </span>
                        </div>



                        <p className="text-sm text-gray-400 mt-2">
                            Uczeń: {s.user?.email}
                        </p>

                        <p className="text-sm text-gray-500">
                            Data: {s.submittedAt}
                        </p>

                        {s.grade && (
                            <p className="text-green-400 mt-2">
                                Ocena: {s.grade}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            <div className="bg-gray-800 p-6 rounded-xl min-h-[400px]">
                {!selected ? (
                    <p className="text-gray-400">
                        Wybierz pracę ucznia z listy.
                    </p>
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
                                <div key={a.id} className="bg-gray-900 p-4 rounded">

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
                            className="w-full bg-gray-700 p-3 rounded"
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
                            className="w-full bg-gray-700 p-3 rounded"
                        />

                        <textarea
                            placeholder="Komentarz nauczyciela"
                            value={selected.teacherComment || ""}
                            onChange={e => setSelected({
                                ...selected,
                                teacherComment: e.target.value
                            })}
                            className="w-full bg-gray-700 p-3 rounded"
                            rows={5}
                        />

                        <button
                            onClick={save}
                            className="bg-green-600 px-6 py-3 rounded font-semibold"
                        >
                            Zapisz sprawdzenie
                        </button>

                        <button
                            onClick={() => deleteSubmission(selected.id)}
                            className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-xl"
                        >
                            Usuń
                        </button>

                    </div>
                )}
            </div>
        </div>
    );
}
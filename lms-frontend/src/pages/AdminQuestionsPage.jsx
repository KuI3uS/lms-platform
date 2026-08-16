import { useEffect, useState } from "react";
import {
    BsCheckCircle,
    BsPatchQuestion,
    BsPlusCircle,
    BsTrash
} from "react-icons/bs";
import { apiFetch } from "../api/api";
import { useFeedback } from "../context/FeedbackContext";

const emptyAnswers = () => [
    { content: "", correct: true },
    { content: "", correct: false }
];

export default function AdminQuestionsPage() {
    const { confirm } = useFeedback();
    const [courses, setCourses] = useState([]);
    const [courseId, setCourseId] = useState("");
    const [modules, setModules] = useState([]);
    const [moduleId, setModuleId] = useState("");
    const [questions, setQuestions] = useState([]);
    const [content, setContent] = useState("");
    const [answers, setAnswers] = useState(emptyAnswers);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        apiFetch("/courses")
            .then((data) => {
                if (!active) return;
                const list = data || [];
                setCourses(list);
                if (list.length > 0) {
                    setLoading(true);
                    setCourseId(String(list[0].id));
                }
            })
            .catch((loadError) => {
                if (active) setError(loadError.message || "Nie udało się pobrać kursów.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (!courseId) {
            return undefined;
        }
        let active = true;
        apiFetch(`/modules/course/${courseId}`)
            .then((data) => {
                if (!active) return;
                const list = data || [];
                setModules(list);
                setLoading(list.length > 0);
                setModuleId(list.length > 0 ? String(list[0].id) : "");
            })
            .catch((loadError) => {
                if (!active) return;
                setError(loadError.message || "Nie udało się pobrać modułów.");
                setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [courseId]);

    useEffect(() => {
        if (!moduleId) {
            return undefined;
        }
        let active = true;
        apiFetch(`/questions/module/${moduleId}`)
            .then((data) => {
                if (active) setQuestions(data || []);
            })
            .catch((loadError) => {
                if (active) setError(loadError.message || "Nie udało się pobrać pytań.");
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [moduleId]);

    const updateAnswer = (index, changes) => {
        setAnswers((current) => current.map((answer, answerIndex) =>
            answerIndex === index ? { ...answer, ...changes } : answer
        ));
    };

    const submit = async (event) => {
        event.preventDefault();
        const cleanAnswers = answers
            .map((answer) => ({ ...answer, content: answer.content.trim() }))
            .filter((answer) => answer.content);

        if (!moduleId || !content.trim() || cleanAnswers.length < 2) {
            setError("Wybierz moduł, wpisz pytanie i co najmniej dwie odpowiedzi.");
            return;
        }
        if (!cleanAnswers.some((answer) => answer.correct)) {
            setError("Zaznacz przynajmniej jedną poprawną odpowiedź.");
            return;
        }

        try {
            setSaving(true);
            setError("");
            const created = await apiFetch(`/questions/module/${moduleId}`, {
                method: "POST",
                body: JSON.stringify({
                    content: content.trim(),
                    answers: cleanAnswers
                })
            });
            setQuestions((current) => [...current, created]);
            setContent("");
            setAnswers(emptyAnswers());
        } catch (saveError) {
            setError(saveError.message || "Nie udało się dodać pytania.");
        } finally {
            setSaving(false);
        }
    };

    const removeQuestion = async (question) => {
        if (!await confirm({ title: "Usuń pytanie", message: "Usunąć to pytanie i wszystkie jego odpowiedzi?", confirmLabel: "Usuń pytanie" })) return;
        try {
            setError("");
            await apiFetch(`/questions/${question.id}`, { method: "DELETE" });
            setQuestions((current) => current.filter((item) => item.id !== question.id));
        } catch (deleteError) {
            setError(deleteError.message || "Nie udało się usunąć pytania.");
        }
    };

    return (
        <div className="mx-auto max-w-6xl space-y-8 text-white">
            <header className="rounded-[34px] border border-orange-500/20 bg-gradient-to-br from-orange-950/70 to-slate-950 p-7 sm:p-10">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-orange-300">EduHub Quiz Builder</p>
                <h1 className="mt-3 text-4xl font-black sm:text-5xl">Pytania egzaminacyjne</h1>
                <p className="mt-4 text-slate-400">
                    Pytania zapisane tutaj trafiają do losowania w symulatorze egzaminu.
                </p>
            </header>

            {error && (
                <div role="alert" className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
                    {error}
                </div>
            )}

            <section className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:grid-cols-2 sm:p-7">
                <label className="text-sm font-bold text-slate-300">
                    Kurs
                    <select
                        value={courseId}
                        onChange={(event) => {
                            setLoading(true);
                            setError("");
                            setCourseId(event.target.value);
                            setModules([]);
                            setModuleId("");
                            setQuestions([]);
                        }}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3"
                    >
                        {courses.length === 0 && <option value="">Brak kursów</option>}
                        {courses.map((course) => (
                            <option key={course.id} value={course.id}>
                                {course.title || course.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="text-sm font-bold text-slate-300">
                    Moduł
                    <select
                        value={moduleId}
                        onChange={(event) => {
                            setLoading(true);
                            setError("");
                            setModuleId(event.target.value);
                            setQuestions([]);
                        }}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3"
                    >
                        {modules.length === 0 && <option value="">Brak modułów</option>}
                        {modules.map((module) => (
                            <option key={module.id} value={module.id}>
                                {module.cefrLevel ? `[${module.cefrLevel}] ` : ""}{module.name}
                            </option>
                        ))}
                    </select>
                </label>
            </section>

            <form onSubmit={submit} className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
                <h2 className="flex items-center gap-3 text-2xl font-black">
                    <BsPlusCircle className="text-orange-300" /> Dodaj pytanie
                </h2>
                <textarea
                    value={content}
                    onChange={(event) => setContent(event.target.value)}
                    placeholder="Treść pytania..."
                    className="min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950 p-4 outline-none focus:border-orange-400"
                />
                <div className="grid gap-3">
                    {answers.map((answer, index) => (
                        <div key={index} className="flex flex-col gap-3 rounded-2xl bg-slate-950/70 p-4 sm:flex-row sm:items-center">
                            <input
                                value={answer.content}
                                onChange={(event) => updateAnswer(index, { content: event.target.value })}
                                placeholder={`Odpowiedź ${index + 1}`}
                                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-900 px-4 py-3"
                            />
                            <label className="flex items-center gap-2 text-sm font-bold text-emerald-300">
                                <input
                                    type="checkbox"
                                    checked={answer.correct}
                                    onChange={(event) => updateAnswer(index, { correct: event.target.checked })}
                                    className="accent-emerald-500"
                                />
                                <BsCheckCircle /> Poprawna
                            </label>
                            {answers.length > 2 && (
                                <button
                                    type="button"
                                    aria-label="Usuń odpowiedź"
                                    onClick={() => setAnswers((current) => current.filter((_, answerIndex) => answerIndex !== index))}
                                    className="rounded-xl p-3 text-red-300 hover:bg-red-500/10"
                                >
                                    <BsTrash />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={() => setAnswers((current) => [...current, { content: "", correct: false }])}
                        className="rounded-xl border border-white/10 px-4 py-3 font-bold text-slate-300"
                    >
                        Dodaj odpowiedź
                    </button>
                    <button
                        type="submit"
                        disabled={saving || !moduleId}
                        className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 px-5 py-3 font-black disabled:opacity-40"
                    >
                        {saving ? "Zapisywanie..." : "Zapisz pytanie"}
                    </button>
                </div>
            </form>

            <section>
                <h2 className="flex items-center gap-3 text-2xl font-black">
                    <BsPatchQuestion className="text-orange-300" /> Pytania w module
                </h2>
                {loading ? (
                    <div className="grid min-h-40 place-items-center">
                        <span className="h-10 w-10 animate-spin rounded-full border-4 border-orange-400 border-t-transparent" />
                    </div>
                ) : questions.length === 0 ? (
                    <p className="mt-5 rounded-3xl border border-dashed border-white/15 p-8 text-center text-slate-500">
                        W tym module nie ma jeszcze pytań.
                    </p>
                ) : (
                    <div className="mt-5 grid gap-3">
                        {questions.map((question, index) => (
                            <article key={question.id} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                                <span className="font-black text-orange-300">{index + 1}.</span>
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-black">{question.content}</h3>
                                    <p className="mt-2 text-sm text-slate-500">
                                        {question.answers?.length || 0} odpowiedzi
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    aria-label="Usuń pytanie"
                                    onClick={() => removeQuestion(question)}
                                    className="h-fit rounded-xl bg-red-500/10 p-3 text-red-300 hover:bg-red-600 hover:text-white"
                                >
                                    <BsTrash />
                                </button>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

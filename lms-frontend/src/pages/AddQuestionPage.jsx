import { useState } from "react";
import { apiFetch } from "../api/api";
import { useFeedback } from "../context/FeedbackContext";
import {
    BsPatchQuestionFill,
    BsCheckCircle,
    BsPlusCircleFill,
    BsTrash,
    BsCollection
} from "react-icons/bs";

export default function AddQuestionPage() {
    const { showToast } = useFeedback();

    const [moduleId, setModuleId] = useState("");

    const [content, setContent] = useState("");

    const [loading, setLoading] = useState(false);

    const [answers, setAnswers] = useState([
        {
            content: "",
            correct: false
        },
        {
            content: "",
            correct: false
        }
    ]);

    function updateAnswer(index, field, value) {

        setAnswers(prev =>
            prev.map((a, i) =>
                i === index
                    ? {
                        ...a,
                        [field]: value
                    }
                    : a
            )
        );

    }

    function addAnswer() {

        setAnswers(prev => [
            ...prev,
            {
                content: "",
                correct: false
            }
        ]);

    }

    function removeAnswer(index) {

        if (answers.length <= 2) {
            return;
        }

        setAnswers(prev =>
            prev.filter((_, i) => i !== index)
        );

    }

    async function submit() {

        if (!moduleId.trim()) {

            showToast("Podaj ID modułu.", "warning");

            return;

        }

        if (!content.trim()) {

            showToast("Podaj treść pytania.", "warning");

            return;

        }

        try {

            setLoading(true);

            await apiFetch(
                `/questions/module/${moduleId}`,
                {
                    method: "POST",
                    body: JSON.stringify({
                        content,
                        answers
                    })
                }
            );

            showToast("Pytanie zostało dodane.", "success");

            setContent("");

            setAnswers([
                {
                    content: "",
                    correct: false
                },
                {
                    content: "",
                    correct: false
                }
            ]);

        } catch (e) {

            showToast(e.message || "Nie udało się dodać pytania.", "error");

        } finally {

            setLoading(false);

        }

    }

    return (

        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,.15),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(147,51,234,.15),transparent_35%),#030712] flex justify-center p-10">

            <section className="w-full max-w-4xl rounded-[36px] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_30px_80px_rgba(0,0,0,.45)] p-10">

                <div className="flex items-center gap-5 mb-10">

                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center">

                        <BsPatchQuestionFill
                            size={38}
                            className="text-white"
                        />

                    </div>

                    <div>

                        <div className="uppercase tracking-[0.25em] text-sm text-blue-300 font-bold">

                            EduHub Quiz Builder

                        </div>

                        <h1 className="text-4xl font-black">

                            Nowe pytanie

                        </h1>

                        <p className="text-gray-400 mt-2">

                            Dodaj pytanie wraz z odpowiedziami.

                        </p>

                    </div>

                </div>

                <div className="space-y-7">

                    <div>

                        <label className="text-gray-300 font-semibold flex items-center gap-2 mb-3">

                            <BsCollection />

                            ID modułu

                        </label>

                        <input
                            value={moduleId}
                            onChange={(e)=>setModuleId(e.target.value)}
                            className="w-full rounded-2xl bg-[#0f172a] border border-white/10 px-5 py-4"
                        />

                    </div>

                    <div>

                        <label className="text-gray-300 font-semibold mb-3 block">

                            Treść pytania

                        </label>

                        <textarea
                            value={content}
                            onChange={(e)=>setContent(e.target.value)}
                            className="w-full rounded-2xl bg-[#0f172a] border border-white/10 p-5 min-h-36"
                        />

                    </div>

                    <div className="space-y-5">

                        <div className="flex items-center justify-between">

                            <h2 className="text-2xl font-bold">

                                Odpowiedzi

                            </h2>

                            <button
                                onClick={addAnswer}
                                className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-2xl flex items-center gap-2 font-bold"
                            >

                                <BsPlusCircleFill />

                                Dodaj odpowiedź

                            </button>

                        </div>

                        {answers.map((answer, index)=>(

                            <div
                                key={index}
                                className="rounded-3xl border border-white/10 bg-[#0f172a] p-6 space-y-4"
                            >

                                <div className="flex justify-between items-center">

                                    <h3 className="font-bold">

                                        Odpowiedź {index + 1}

                                    </h3>

                                    {answers.length > 2 && (

                                        <button
                                            onClick={()=>removeAnswer(index)}
                                            className="text-red-400 hover:text-red-300"
                                        >

                                            <BsTrash size={20} />

                                        </button>

                                    )}

                                </div>

                                <input
                                    value={answer.content}
                                    onChange={(e)=>updateAnswer(index,"content",e.target.value)}
                                    placeholder="Treść odpowiedzi..."
                                    className="w-full rounded-xl bg-gray-900 border border-gray-700 px-4 py-3"
                                />

                                <label className="flex items-center gap-3 cursor-pointer">

                                    <input
                                        type="checkbox"
                                        checked={answer.correct}
                                        onChange={(e)=>updateAnswer(index,"correct",e.target.checked)}
                                    />

                                    <BsCheckCircle className="text-green-400"/>

                                    Poprawna odpowiedź

                                </label>

                            </div>

                        ))}

                    </div>

                    <button
                        disabled={loading}
                        onClick={submit}
                        className="w-full rounded-2xl py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.01] transition font-black text-lg"
                    >

                        {loading
                            ? "Zapisywanie..."
                            : "Dodaj pytanie"}

                    </button>

                </div>

            </section>

        </div>

    );

}

import { useState } from "react";
import { BsCheck2Circle, BsClipboardCheck, BsLaptop, BsLightbulb } from "react-icons/bs";

export default function LessonPracticalLab({ block, result, checking, onCheck }) {
    const [helpByBlock, setHelpByBlock] = useState({});
    const helpLevel = helpByBlock[block.id] || 0;
    const setHelpLevel = level => setHelpByBlock(previous => ({
        ...previous,
        [block.id]: level
    }));

    const availableHelpLevel = block.detailedHint ? 2 : block.hint ? 1 : 0;

    return (
        <section className="overflow-hidden rounded-3xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/10 via-gray-900 to-gray-950">
            <div className="border-b border-white/10 p-5 sm:p-8">
                <p className="flex items-center gap-2 font-black uppercase tracking-[0.16em] text-emerald-300">
                    <BsLaptop /> Laboratorium praktyczne
                </p>
                <h2 className="mt-3 text-2xl font-black text-white sm:text-3xl">
                    {block.title}
                </h2>
                {block.description && (
                    <div className="mt-5 whitespace-pre-line rounded-2xl border border-white/10 bg-white/[0.04] p-5 leading-7 text-gray-300">
                        {block.description}
                    </div>
                )}
            </div>

            <div className="space-y-6 p-5 sm:p-8">
                <div>
                    <p className="mb-3 font-black text-emerald-200">Cel i wymagania</p>
                    <div className="whitespace-pre-line text-base leading-8 text-gray-200">{block.instruction}</div>
                </div>

                <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.07] p-5 sm:p-6">
                    <p className="flex items-center gap-2 font-black text-cyan-100">
                        <BsClipboardCheck /> Weryfikacja i kryteria ukończenia
                    </p>
                    <div className="mt-3 whitespace-pre-line leading-8 text-cyan-50/85">{block.content}</div>
                </div>

                {availableHelpLevel > 0 && !result?.correct && (
                    <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/[0.06] p-5">
                        {helpLevel === 0 ? (
                            <button
                                type="button"
                                onClick={() => setHelpLevel(block.hint ? 1 : 2)}
                                className="flex items-center gap-2 font-black text-yellow-200 transition hover:text-yellow-100"
                            >
                                <BsLightbulb /> {block.hint ? "Pokaż małą podpowiedź" : "Pokaż podpowiedź"}
                            </button>
                        ) : (
                            <div>
                                <p className="flex items-center gap-2 font-black text-yellow-200">
                                    <BsLightbulb /> Podpowiedź
                                </p>
                                <p className="mt-3 whitespace-pre-line leading-7 text-yellow-50/85">
                                    {helpLevel >= 2 && block.detailedHint ? block.detailedHint : block.hint}
                                </p>
                                {helpLevel === 1 && block.detailedHint && (
                                    <button
                                        type="button"
                                        onClick={() => setHelpLevel(2)}
                                        className="mt-4 rounded-xl border border-yellow-300/25 bg-yellow-300/10 px-4 py-2 text-sm font-black text-yellow-100 transition hover:bg-yellow-300/20"
                                    >
                                        Nadal nie wiem — pokaż dokładniejszą pomoc
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                <button
                    type="button"
                    disabled={checking || result?.correct}
                    onClick={() => onCheck(block.id, "completed")}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 font-black text-white transition hover:bg-emerald-500 disabled:cursor-default disabled:opacity-70"
                >
                    <BsCheck2Circle size={20} />
                    {checking ? "Zapisuję..." : result?.correct ? "Laboratorium ukończone" : "Potwierdzam wykonanie i weryfikację"}
                </button>

                {result?.correct && (
                    <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4 text-emerald-100">
                        {result.message}
                        {result.xpEarned > 0 && <strong className="ml-2">+{result.xpEarned} XP</strong>}
                    </div>
                )}
                {result?.error && (
                    <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-4 text-rose-100">
                        {result.message}
                    </div>
                )}
            </div>
        </section>
    );
}

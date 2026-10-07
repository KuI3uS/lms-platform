import { useState } from "react";
import { BsImage, BsArrowsFullscreen, BsX } from "react-icons/bs";

export default function LessonImage({ block }) {
    const [open, setOpen] = useState(false);
    const [imageError, setImageError] = useState(false);

    if (!block.content || imageError) {
        return (
            <section className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-red-300">
                Nie udało się załadować grafiki.
            </section>
        );
    }

    return (
        <>
            <section className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-gray-900 to-gray-950 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-300">
                            <BsImage size={22} />
                        </div>

                        <div>
                            <p className="text-sm text-purple-300 font-semibold">
                                Grafika
                            </p>

                            <h2 className="text-xl font-bold">
                                {block.title || "Materiał graficzny"}
                            </h2>
                        </div>
                    </div>

                    <button
                        onClick={() => setOpen(true)}
                        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl transition"
                    >
                        <BsArrowsFullscreen />
                        Powiększ
                    </button>
                </div>

                <div className="p-6 bg-gray-950/60">
                    <img
                        src={block.content}
                        alt={block.title || "Grafika lekcji"}
                        onError={() => setImageError(true)}
                        onClick={() => setOpen(true)}
                        className="w-full rounded-2xl border border-gray-800 cursor-zoom-in shadow-2xl"
                    />
                </div>
            </section>

            {open && (
                <div className="fixed inset-0 z-50 bg-black/90 p-6 flex items-center justify-center">
                    <button
                        onClick={() => setOpen(false)}
                        className="absolute top-6 right-6 bg-gray-800 hover:bg-gray-700 p-4 rounded-2xl text-white"
                    >
                        <BsX size={28} />
                    </button>

                    <img
                        src={block.content}
                        alt={block.title || "Grafika lekcji"}
                        className="max-w-full max-h-full rounded-2xl border border-gray-700"
                    />
                </div>
            )}
        </>
    );
}
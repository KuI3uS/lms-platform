import {
    BsArrowLeft,
    BsClock,
    BsFire,
    BsStars
} from "react-icons/bs";

export default function LessonHero({ lesson, moduleLessons, onBack }) {
    const completedCount = moduleLessons.filter(l => l.completed).length;

    const progress = moduleLessons.length > 0
        ? Math.round((completedCount / moduleLessons.length) * 100)
        : 0;

    return (
        <section className="relative overflow-hidden rounded-[2rem] border border-blue-500/20 bg-gradient-to-br from-blue-600/25 via-gray-900 to-purple-700/20 p-8 shadow-2xl">

            <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">

                <div className="space-y-5">
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white transition"
                    >
                        <BsArrowLeft />
                        Wróć do kursu
                    </button>

                    <div>
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-sm font-bold">
                                Lekcja {lesson.orderIndex ?? ""}
                            </span>

                            {lesson.freePreview && (
                                <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 text-sm font-bold">
                                    Darmowy podgląd
                                </span>
                            )}

                            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-sm font-bold flex items-center gap-2">
                                <BsStars />
                                EduHub 2026
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                            {lesson.title}
                        </h1>

                        <p className="text-gray-300 mt-4 max-w-2xl text-lg">
                            Przejdź przez materiał, sprawdź przykłady i rozwiąż zadania praktyczne.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="bg-gray-950/60 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
                            <BsClock className="text-blue-400" />
                            <span className="text-sm text-gray-300">około 45 minut pracy</span>
                        </div>

                        <div className="bg-gray-950/60 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">
                            <BsFire className="text-orange-400" />
                            <span className="text-sm text-gray-300">praktyka + teoria</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-950/70 border border-white/10 rounded-3xl p-6 min-w-[280px]">
                    <div className="flex justify-between mb-3">
                        <span className="text-gray-400">Postęp modułu</span>
                        <span className="font-black">{progress}%</span>
                    </div>

                    <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                        <div
                            className="h-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    <p className="text-sm text-gray-400 mt-3">
                        {completedCount} / {moduleLessons.length} lekcji ukończonych
                    </p>
                </div>

            </div>
        </section>
    );
}
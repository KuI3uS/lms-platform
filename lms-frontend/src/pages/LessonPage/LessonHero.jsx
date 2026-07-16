import {
    BsArrowLeft,
    BsClock,
    BsFire,
    BsStars
} from "react-icons/bs";

export default function LessonHero({
                                       lesson,
                                       moduleLessons,
                                       onBack
                                   }) {

    const completedCount =
        moduleLessons.filter(l => l.completed).length;

    const progress =
        moduleLessons.length
            ? Math.round(
                (completedCount / moduleLessons.length) * 100
            )
            : 0;

    return (

        <section className="relative overflow-hidden rounded-[2rem] border border-blue-500/20 bg-gradient-to-br from-blue-600/25 via-gray-900 to-purple-700/20 p-5 shadow-2xl sm:p-8">

            <div className="absolute -top-24 -right-24 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />

            <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />

            <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-8">

                <div className="space-y-5">

                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white transition"
                    >
                        <BsArrowLeft />

                        Wróć do kursu

                    </button>

                    <div>

                        <div className="flex flex-wrap gap-3 mb-4">

                            <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-bold">

                                Lekcja {lesson.orderIndex}

                            </span>

                            {lesson.freePreview && (

                                <span className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-sm font-bold">

                                    Darmowy podgląd

                                </span>

                            )}

                            <span className="px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-bold flex items-center gap-2">

                                <BsStars />

                                EduHub 2026

                            </span>

                        </div>

                        <h1 className="text-3xl font-black sm:text-4xl lg:text-5xl">

                            {lesson.title}

                        </h1>

                        <p className="mt-5 text-lg text-gray-300 max-w-3xl whitespace-pre-line">

                            {lesson.theory ||
                                "Przejdź przez materiał, zapoznaj się z przykładami oraz wykonaj zadania praktyczne."}

                        </p>

                    </div>

                    <div className="flex flex-wrap gap-3">

                        <div className="bg-gray-950/60 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">

                            <BsClock className="text-blue-400" />

                            <span className="text-sm text-gray-300">

                                około 45 minut

                            </span>

                        </div>

                        <div className="bg-gray-950/60 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-3">

                            <BsFire className="text-orange-400" />

                            <span className="text-sm text-gray-300">

                                teoria + praktyka

                            </span>

                        </div>

                    </div>

                </div>

                <div className="w-full rounded-3xl border border-white/10 bg-gray-950/70 p-6 lg:min-w-[300px] lg:w-auto">

                    <div className="flex justify-between mb-3">

                        <span className="text-gray-400">

                            Postęp modułu

                        </span>

                        <span className="font-black">

                            {progress}%

                        </span>

                    </div>

                    <div className="w-full h-4 rounded-full overflow-hidden bg-gray-800">

                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                            style={{
                                width: `${progress}%`
                            }}
                        />

                    </div>

                    <p className="mt-4 text-sm text-gray-400">

                        {completedCount} / {moduleLessons.length} lekcji ukończonych

                    </p>

                </div>

            </div>

        </section>

    );

}

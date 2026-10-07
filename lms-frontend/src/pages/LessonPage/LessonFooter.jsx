import {
    BsSendFill,
    BsArrowLeft,
    BsArrowRight,
    BsCheckCircleFill
} from "react-icons/bs";

export default function LessonFooter({
                                         hasTasks,
                                         onSubmit,
                                         previousLesson,
                                         nextLesson,
                                         onPrevious,
                                         onNext
                                     }) {
    return (
        <section className="rounded-3xl border border-gray-800 bg-gray-900 p-6">

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

                <div className="flex gap-3">

                    <button
                        disabled={!previousLesson}
                        onClick={onPrevious}
                        className={`px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 transition ${
                            previousLesson
                                ? "bg-gray-800 hover:bg-gray-700"
                                : "bg-gray-800/50 opacity-50 cursor-not-allowed"
                        }`}
                    >
                        <BsArrowLeft />
                        Poprzednia
                    </button>

                    <button
                        disabled={!nextLesson}
                        onClick={onNext}
                        className={`px-6 py-3 rounded-2xl font-semibold flex items-center gap-2 transition ${
                            nextLesson
                                ? "bg-blue-600 hover:bg-blue-700"
                                : "bg-gray-800/50 opacity-50 cursor-not-allowed"
                        }`}
                    >
                        Następna
                        <BsArrowRight />
                    </button>

                </div>

                {hasTasks && (
                    <button
                        onClick={onSubmit}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-lg"
                    >
                        <BsSendFill />
                        Wyślij lekcję
                    </button>
                )}

                {!hasTasks && (
                    <div className="flex items-center gap-3 text-green-400 font-semibold">
                        <BsCheckCircleFill size={22} />
                        Ta lekcja nie zawiera zadań.
                    </div>
                )}

            </div>

        </section>
    );
}
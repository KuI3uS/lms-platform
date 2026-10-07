import {
    BsArrowLeft,
    BsArrowRight,
    BsCheck2All,
    BsCheckCircleFill,
    BsExclamationCircle
} from "react-icons/bs";

export default function LessonFooter({
                                         hasTasks,
                                         onFinish,
                                         finishing,
                                         finishResult,
                                         previousLesson,
                                         nextLesson,
                                         onPrevious,
                                         onNext
                                     }) {

    return (
        <section className="rounded-3xl border border-gray-800 bg-gray-900 p-4 sm:p-6">
            {finishResult && (
                <div className={`mb-5 flex gap-3 rounded-2xl border p-4 ${
                    finishResult.success
                        ? "border-green-500/30 bg-green-500/10 text-green-300"
                        : "border-red-500/30 bg-red-500/10 text-red-300"
                }`}>
                    {finishResult.success
                        ? <BsCheckCircleFill className="mt-0.5 shrink-0" size={21}/>
                        : <BsExclamationCircle className="mt-0.5 shrink-0" size={21}/>
                    }
                    <div>
                        <p className="font-bold">{finishResult.message}</p>
                        {finishResult.summary && (
                            <p className="mt-1 text-sm opacity-80">{finishResult.summary}</p>
                        )}
                    </div>
                </div>
            )}

            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="grid gap-3 sm:grid-cols-2">
                    <button
                        type="button"
                        disabled={!previousLesson}
                        onClick={onPrevious}
                        className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold transition ${
                            previousLesson
                                ? "bg-gray-800 hover:bg-gray-700"
                                : "cursor-not-allowed bg-gray-800 opacity-40"
                        }`}
                    >
                        <BsArrowLeft />
                        Poprzednia lekcja
                    </button>

                    <button
                        type="button"
                        disabled={!nextLesson?.canAccess}
                        onClick={onNext}
                        className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold transition ${
                            nextLesson?.canAccess
                                ? "bg-blue-600 hover:bg-blue-700"
                                : "cursor-not-allowed bg-gray-800 opacity-40"
                        }`}
                    >
                        Następna lekcja
                        <BsArrowRight />
                    </button>
                </div>

                <button
                    type="button"
                    disabled={finishing}
                    onClick={onFinish}
                    className="flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 font-bold shadow-lg transition hover:from-purple-700 hover:to-blue-700 disabled:cursor-wait disabled:opacity-60"
                >
                    <BsCheck2All />
                    {finishing
                        ? "Sprawdzam rozwiązanie..."
                        : hasTasks
                            ? "Zakończ rozwiązanie"
                            : "Zakończ lekcję"
                    }
                </button>
            </div>
        </section>
    );
}

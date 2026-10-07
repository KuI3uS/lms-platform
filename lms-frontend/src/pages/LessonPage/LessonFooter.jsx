import {
    BsArrowLeft,
    BsArrowRight,
    BsCheck2All,
    BsCheckCircleFill,
    BsExclamationCircle
} from "react-icons/bs";

export default function LessonFooter({
                                         onFinish,
                                         finishing,
                                         finishResult,
                                         hasPreviousStep,
                                         hasNextStep,
                                         canContinue,
                                         onPreviousStep,
                                         onNextStep,
                                         previousLesson,
                                         nextLesson,
                                         onPreviousLesson,
                                         onNextLesson,
                                         onBack,
                                         completedAssessments,
                                         totalAssessments,
                                         hasTasks
                                     }) {
    const hasPreviousDestination = hasPreviousStep || previousLesson;
    const finishSucceeded = Boolean(finishResult?.success);

    function handlePrevious() {
        if (hasPreviousStep) {
            onPreviousStep();
            return;
        }
        onPreviousLesson();
    }

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

            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-sm">
                <p className="font-semibold text-gray-300">
                    {hasTasks
                        ? `Zaliczone ćwiczenia: ${completedAssessments} / ${totalAssessments}`
                        : "Ta lekcja nie zawiera zadań automatycznych."
                    }
                </p>
                <p className="text-gray-500">
                    Każde ćwiczenie jest zaliczane osobno.
                </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                    type="button"
                    disabled={!hasPreviousDestination}
                    onClick={handlePrevious}
                    className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold transition ${
                        hasPreviousDestination
                            ? "bg-gray-800 hover:bg-gray-700"
                            : "cursor-not-allowed bg-gray-800 opacity-40"
                    }`}
                >
                    <BsArrowLeft />
                    {hasPreviousStep ? "Poprzedni krok" : "Poprzednia lekcja"}
                </button>

                {hasNextStep ? (
                    <button
                        type="button"
                        disabled={!canContinue}
                        onClick={onNextStep}
                        className={`flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-semibold transition ${
                            canContinue
                                ? "bg-blue-600 hover:bg-blue-700"
                                : "cursor-not-allowed bg-gray-800 text-gray-500"
                        }`}
                    >
                        {canContinue ? "Dalej" : "Najpierw zalicz ten krok"}
                        <BsArrowRight />
                    </button>
                ) : finishSucceeded ? (
                    <button
                        type="button"
                        onClick={nextLesson ? onNextLesson : onBack}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-bold transition hover:bg-blue-700"
                    >
                        {nextLesson ? "Rozpocznij następną lekcję" : "Wróć do ścieżki"}
                        <BsArrowRight />
                    </button>
                ) : (
                    <button
                        type="button"
                        disabled={finishing || !canContinue}
                        onClick={onFinish}
                        className="flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 font-bold shadow-lg transition hover:from-purple-700 hover:to-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <BsCheck2All />
                        {finishing ? "Kończę lekcję..." : "Zakończ lekcję"}
                    </button>
                )}
            </div>
        </section>
    );
}

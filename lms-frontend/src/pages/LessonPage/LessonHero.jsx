import {
    BsArrowLeft,
    BsClock,
    BsFire
} from "react-icons/bs";
import { useLocale } from "../../context/LocaleContext";
import LocaleControls from "../../components/LocaleControls";

export default function LessonHero({
                                       lesson,
                                       moduleLessons,
                                       onBack
                                   }) {
    const { t, formatNumber } = useLocale();
    const completedCount = moduleLessons.filter(item => item.completed).length;
    const progress = moduleLessons.length
        ? Math.round((completedCount / moduleLessons.length) * 100)
        : 0;

    return (
        <header className="mx-auto flex max-w-5xl flex-col gap-5 px-2 py-2 sm:px-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-white"
                >
                    <BsArrowLeft />
                    {t("Wróć do kursu")}
                </button>
                <LocaleControls compact />
                </div>

                <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-blue-300">
                    {t("Lekcja {number}", { number: formatNumber(lesson.orderIndex ?? 1) })}
                    {lesson.freePreview ? ` · ${t("Darmowy podgląd")}` : ""}
                </p>
                <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                    {lesson.title}
                </h1>
                <p className="mt-3 max-w-3xl text-base leading-7 text-gray-400">
                    {lesson.theory
                        || t("Przejdź przez materiał i wykonaj kolejne ćwiczenia.")}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-gray-500">
                    <span className="inline-flex items-center gap-2">
                        <BsClock className="text-blue-400" />
                        {t("około 45 minut")}
                    </span>
                    <span className="inline-flex items-center gap-2">
                        <BsFire className="text-orange-400" />
                        {t("teoria + praktyka")}
                    </span>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
                <div
                    className="grid h-16 w-16 place-items-center rounded-full p-1"
                    style={{
                        background: `conic-gradient(#22d3ee ${progress}%, rgba(31,41,55,.8) ${progress}%)`
                    }}
                >
                    <div className="grid h-full w-full place-items-center rounded-full bg-gray-950 text-sm font-black">
                        {formatNumber(progress)}%
                    </div>
                </div>
                <div className="text-xs text-gray-500">
                    <p className="font-bold text-gray-300">{t("Postęp etapu")}</p>
                    <p className="mt-1">{t("{completed}/{total} lekcji", { completed: formatNumber(completedCount), total: formatNumber(moduleLessons.length) })}</p>
                </div>
            </div>
        </header>
    );
}

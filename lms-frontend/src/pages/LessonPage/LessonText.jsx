import {
    BsBook,
    BsCheckCircleFill,
    BsExclamationTriangle,
    BsInfoCircle,
    BsLightbulb
} from "react-icons/bs";
import LessonArticleContent from "./LessonArticleContent";

const CALLOUTS = {
    TIP: {
        wrapper: "border-violet-500/30 bg-violet-500/10",
        bar: "bg-violet-400",
        iconBox: "bg-violet-500/20 text-violet-200",
        label: "text-violet-300",
        labelText: "Wskazówka",
        title: "Dobra praktyka",
        icon: <BsLightbulb />
    },
    WARNING: {
        wrapper: "border-amber-500/30 bg-amber-500/10",
        bar: "bg-amber-400",
        iconBox: "bg-amber-500/20 text-amber-200",
        label: "text-amber-300",
        labelText: "Ostrzeżenie",
        title: "Zwróć uwagę",
        icon: <BsExclamationTriangle />
    },
    INFO: {
        wrapper: "border-sky-500/30 bg-sky-500/10",
        bar: "bg-sky-400",
        iconBox: "bg-sky-500/20 text-sky-200",
        label: "text-sky-300",
        labelText: "Informacja",
        title: "Warto wiedzieć",
        icon: <BsInfoCircle />
    }
};

export default function LessonText({ block }) {
    if (block.type === "SUMMARY") {
        const points = (block.content || "")
            .split("\n")
            .map(point => point.trim().replace(/^[-•]\s*/, ""))
            .filter(Boolean);

        return (
            <section className="overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-gray-900 to-gray-950">
                <header className="border-b border-emerald-300/15 p-6 sm:p-8">
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">
                        Podsumowanie
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-white">
                        {block.title || "Co warto zapamiętać?"}
                    </h2>
                </header>
                <ul className="grid gap-3 p-5 sm:p-8 md:grid-cols-2">
                    {(points.length ? points : ["Brak punktów podsumowania."]).map((point, index) => (
                        <li
                            key={`${point}-${index}`}
                            className="flex gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.07] p-4 leading-7 text-emerald-50"
                        >
                            <BsCheckCircleFill className="mt-1 shrink-0 text-emerald-300" />
                            <span>{point}</span>
                        </li>
                    ))}
                </ul>
            </section>
        );
    }

    const callout = CALLOUTS[block.type];
    if (callout) {
        return (
            <aside className={`relative overflow-hidden rounded-3xl border p-5 sm:p-7 ${callout.wrapper}`}>
                <div className={`absolute inset-y-0 left-0 w-1.5 ${callout.bar}`} />
                <div className="flex items-start gap-4">
                    <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-xl ${callout.iconBox}`}>
                        {callout.icon}
                    </div>
                    <div className="min-w-0">
                        <p className={`text-xs font-black uppercase tracking-[0.2em] ${callout.label}`}>
                            {callout.labelText}
                        </p>
                        <h2 className="mt-1 text-2xl font-black text-white">
                            {block.title || callout.title}
                        </h2>
                        <div className="mt-4">
                            <LessonArticleContent
                                content={block.content}
                                compact
                            />
                        </div>
                    </div>
                </div>
            </aside>
        );
    }

    return (
        <article className="overflow-hidden rounded-3xl border border-gray-800 bg-gray-900">
            <header className="flex items-center gap-4 border-b border-gray-800 px-6 py-6 sm:px-10 sm:py-8">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-500/15 text-xl text-blue-200">
                    <BsBook />
                </div>
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-300">
                        Materiał
                    </p>
                    <h2 className="mt-1 text-3xl font-black text-white">
                        {block.title || "Teoria"}
                    </h2>
                </div>
            </header>
            <div className="px-6 py-8 sm:px-10 sm:py-11 lg:px-14">
                <LessonArticleContent content={block.content} />
            </div>
        </article>
    );
}

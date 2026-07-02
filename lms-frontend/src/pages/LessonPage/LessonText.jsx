import {
    BsBook,
    BsLightbulb,
    BsExclamationTriangle,
    BsInfoCircle
} from "react-icons/bs";

export default function LessonText({ block }) {
    const config = getTextBlockConfig(block.type);

    return (
        <section className={`relative overflow-hidden rounded-3xl border p-8 ${config.wrapper}`}>
            <div className={`absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl ${config.glow}`} />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${config.iconBox}`}>
                        {config.icon}
                    </div>

                    <div>
                        <p className={`text-sm font-bold ${config.label}`}>
                            {config.labelText}
                        </p>

                        <h2 className="text-2xl font-black text-white">
                            {block.title || config.defaultTitle}
                        </h2>
                    </div>
                </div>

                <div className="prose prose-invert max-w-none">
                    <p className="whitespace-pre-line text-gray-300 leading-8 text-lg">
                        {block.content || "Brak treści."}
                    </p>
                </div>
            </div>
        </section>
    );
}

function getTextBlockConfig(type) {
    if (type === "TIP") {
        return {
            wrapper: "bg-purple-500/10 border-purple-500/30",
            glow: "bg-purple-500/20",
            iconBox: "bg-purple-500/20 text-purple-300",
            label: "text-purple-300",
            labelText: "Wskazówka",
            defaultTitle: "Tip",
            icon: <BsLightbulb />
        };
    }

    if (type === "WARNING") {
        return {
            wrapper: "bg-yellow-500/10 border-yellow-500/30",
            glow: "bg-yellow-500/20",
            iconBox: "bg-yellow-500/20 text-yellow-300",
            label: "text-yellow-300",
            labelText: "Uwaga",
            defaultTitle: "Ważna informacja",
            icon: <BsExclamationTriangle />
        };
    }

    if (type === "SUMMARY") {
        return {
            wrapper: "bg-cyan-500/10 border-cyan-500/30",
            glow: "bg-cyan-500/20",
            iconBox: "bg-cyan-500/20 text-cyan-300",
            label: "text-cyan-300",
            labelText: "Podsumowanie",
            defaultTitle: "Podsumowanie lekcji",
            icon: <BsInfoCircle />
        };
    }

    return {
        wrapper: "bg-gray-900 border-gray-800",
        glow: "bg-blue-500/10",
        iconBox: "bg-blue-500/20 text-blue-300",
        label: "text-blue-300",
        labelText: "Teoria",
        defaultTitle: "Teoria",
        icon: <BsBook />
    };
}
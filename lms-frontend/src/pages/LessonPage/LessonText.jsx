import {
    BsBook,
    BsLightbulb,
    BsExclamationTriangle,
    BsInfoCircle,
    BsCheckCircle,
    BsQuote
} from "react-icons/bs";

export default function LessonText({ block }) {

    const config = getTextBlockConfig(block.type);

    return (

        <section className={`relative overflow-hidden rounded-3xl border p-8 ${config.wrapper}`}>

            <div className={`absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl ${config.glow}`} />

            <div className="relative z-10">

                <div className="flex items-center gap-4 mb-8">

                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${config.iconBox}`}>

                        {config.icon}

                    </div>

                    <div>

                        <p className={`text-sm font-bold uppercase tracking-wider ${config.label}`}>

                            {config.labelText}

                        </p>

                        <h2 className="text-3xl font-black text-white">

                            {block.title || config.defaultTitle}

                        </h2>

                    </div>

                </div>

                <div className="prose prose-invert max-w-none">

                    <div className="whitespace-pre-line text-gray-300 leading-8 text-lg">

                        {block.content || "Brak treści."}

                    </div>

                </div>

            </div>

        </section>

    );

}

function getTextBlockConfig(type) {

    switch (type) {

        case "TIP":

            return {

                wrapper: "bg-purple-500/10 border-purple-500/30",

                glow: "bg-purple-500/20",

                iconBox: "bg-purple-500/20 text-purple-300",

                label: "text-purple-300",

                labelText: "Wskazówka",

                defaultTitle: "Wskazówka",

                icon: <BsLightbulb />

            };

        case "WARNING":

            return {

                wrapper: "bg-yellow-500/10 border-yellow-500/30",

                glow: "bg-yellow-500/20",

                iconBox: "bg-yellow-500/20 text-yellow-300",

                label: "text-yellow-300",

                labelText: "Uwaga",

                defaultTitle: "Ostrzeżenie",

                icon: <BsExclamationTriangle />

            };

        case "INFO":

            return {

                wrapper: "bg-sky-500/10 border-sky-500/30",

                glow: "bg-sky-500/20",

                iconBox: "bg-sky-500/20 text-sky-300",

                label: "text-sky-300",

                labelText: "Informacja",

                defaultTitle: "Informacja",

                icon: <BsInfoCircle />

            };

        case "SUMMARY":

            return {

                wrapper: "bg-green-500/10 border-green-500/30",

                glow: "bg-green-500/20",

                iconBox: "bg-green-500/20 text-green-300",

                label: "text-green-300",

                labelText: "Podsumowanie",

                defaultTitle: "Podsumowanie",

                icon: <BsCheckCircle />

            };

        case "QUOTE":

            return {

                wrapper: "bg-orange-500/10 border-orange-500/30",

                glow: "bg-orange-500/20",

                iconBox: "bg-orange-500/20 text-orange-300",

                label: "text-orange-300",

                labelText: "Cytat",

                defaultTitle: "Cytat",

                icon: <BsQuote />

            };

        case "TEXT":
        default:

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

}
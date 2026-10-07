import { Link } from "react-router-dom";
import {
    BsPeopleFill,
    BsBookHalf,
    BsCollectionPlay,
    BsClipboardCheck,
    BsBarChartFill,
    BsGearFill,
    BsArrowRight
} from "react-icons/bs";

const cards = [

    {
        title: "Użytkownicy",
        description: "Zarządzaj kontami użytkowników, rolami oraz dostępami.",
        icon: <BsPeopleFill size={30} />,
        color: "from-blue-500 to-cyan-500",
        to: "/admin/users"
    },

    {
        title: "Kursy",
        description: "Twórz nowe kursy oraz zarządzaj istniejącymi.",
        icon: <BsBookHalf size={30} />,
        color: "from-purple-500 to-pink-500",
        to: "/admin/courses"
    },

    {
        title: "Moduły",
        description: "Dodawaj moduły oraz organizuj strukturę kursów.",
        icon: <BsCollectionPlay size={30} />,
        color: "from-green-500 to-emerald-500",
        to: "/admin/modules"
    },

    {
        title: "Quizy",
        description: "Twórz pytania, odpowiedzi i testy dla uczniów.",
        icon: <BsClipboardCheck size={30} />,
        color: "from-orange-500 to-red-500",
        to: "/admin/questions"
    },

    {
        title: "Statystyki",
        description: "Śledź postępy użytkowników i aktywność platformy.",
        icon: <BsBarChartFill size={30} />,
        color: "from-cyan-500 to-blue-600",
        to: "/admin/statistics"
    },

    {
        title: "Ustawienia",
        description: "Konfiguracja platformy oraz parametrów systemu.",
        icon: <BsGearFill size={30} />,
        color: "from-gray-500 to-gray-700",
        to: "/admin/settings"
    }

];

export default function AdminPage() {

    return (

        <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,.15),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(147,51,234,.15),transparent_35%),#030712] p-10">

            <div className="max-w-7xl mx-auto space-y-10">

                <div>

                    <div className="uppercase tracking-[0.25em] text-sm text-blue-300 font-bold">

                        EduHub Admin

                    </div>

                    <h1 className="text-5xl font-black mt-2">

                        Panel administratora

                    </h1>

                    <p className="text-gray-400 mt-4 text-lg">

                        Zarządzaj kursami, lekcjami, użytkownikami oraz całą platformą z jednego miejsca.

                    </p>

                </div>

                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">

                    {cards.map(card => (

                        <Link
                            key={card.title}
                            to={card.to}
                            className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl p-8 hover:border-blue-500/40 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(37,99,235,.25)]"
                        >

                            <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${card.color}`} />

                            <div className="relative">

                                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white shadow-xl`}>

                                    {card.icon}

                                </div>

                                <h2 className="mt-8 text-2xl font-black">

                                    {card.title}

                                </h2>

                                <p className="mt-4 text-gray-400 leading-7">

                                    {card.description}

                                </p>

                                <div className="mt-8 flex items-center gap-2 text-blue-300 font-bold group-hover:translate-x-2 transition">

                                    Otwórz

                                    <BsArrowRight />

                                </div>

                            </div>

                        </Link>

                    ))}

                </div>

            </div>

        </div>

    );

}
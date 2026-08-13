import {
    BsChevronDown,
    BsChevronUp,
    BsCollection,
    BsPencilSquare,
    BsTrash,
    BsStars,
    BsArrowRight
} from "react-icons/bs";

import BlockManager from "../../components/BlockManager/BlockManager";

export default function LessonCard({

                                       lesson,

                                       expanded,

                                       toggle,

                                       onEdit,

                                       onDelete,

                                       lessonBlocks,
                                       variant = "PROGRAMMING"

                                   }) {

    return (

        <div
            className="
                relative
                overflow-hidden
                rounded-[32px]
                border
                border-cyan-500/10
                bg-gradient-to-br
                from-slate-900
                via-[#0b1424]
                to-slate-900
                transition
                hover:border-cyan-500/40
            "
        >

            {/* Glow */}

            <div
                className="
                    absolute
                    -right-20
                    -top-20
                    w-64
                    h-64
                    rounded-full
                    bg-cyan-500/10
                    blur-3xl
                "
            />

            {/* HEADER */}

            <div className="relative z-10 p-7">

                <div className="flex items-start justify-between gap-6">

                    {/* LEWA */}

                    <div
                        onClick={() => toggle(lesson.id)}
                        className="
                            flex
                            gap-5
                            flex-1
                            cursor-pointer
                        "
                    >

                        <div
                            className="
                                w-16
                                h-16
                                rounded-3xl
                                bg-gradient-to-br
                                from-cyan-500
                                to-blue-600
                                flex
                                items-center
                                justify-center
                                shadow-lg
                            "
                        >

                            <BsCollection size={28} />

                        </div>

                        <div className="flex-1">

                            <div
                                className="
                                    inline-flex
                                    items-center
                                    gap-2
                                    rounded-full
                                    bg-cyan-500/10
                                    border
                                    border-cyan-500/20
                                    px-4
                                    py-1
                                    text-cyan-300
                                    text-sm
                                    font-semibold
                                "
                            >

                                <BsStars />

                                Lekcja {lesson.orderIndex}

                            </div>

                            <h2 className="text-3xl font-black mt-5">

                                {lesson.title}

                            </h2>

                            <p className="text-gray-400 mt-3">

                                {variant === "LANGUAGE"
                                    ? "Dodaj słownictwo, przykłady, obrazy i krótkie ćwiczenia."
                                    : "Zarządzaj blokami, zadaniami, teorią, quizami oraz multimediami."}

                            </p>

                        </div>

                    </div>

                    {/* PRAWA */}

                    <div className="flex gap-3">

                        <button

                            onClick={() => onEdit(lesson)}

                            className="
                                w-12
                                h-12
                                rounded-2xl
                                bg-yellow-500/10
                                border
                                border-yellow-500/20
                                text-yellow-300
                                hover:bg-yellow-500
                                hover:text-white
                                transition
                            "

                        >

                            <BsPencilSquare size={18} />

                        </button>

                        <button

                            onClick={() => onDelete(lesson.id)}

                            className="
                                w-12
                                h-12
                                rounded-2xl
                                bg-red-500/10
                                border
                                border-red-500/20
                                text-red-300
                                hover:bg-red-600
                                hover:text-white
                                transition
                            "

                        >

                            <BsTrash size={18} />

                        </button>

                        <button

                            onClick={() => toggle(lesson.id)}

                            className="
                                w-12
                                h-12
                                rounded-2xl
                                bg-cyan-500/10
                                border
                                border-cyan-500/20
                                text-cyan-300
                                hover:bg-cyan-500
                                hover:text-white
                                transition
                            "

                        >

                            {

                                expanded

                                    ? <BsChevronUp size={18}/>

                                    : <BsChevronDown size={18}/>

                            }

                        </button>

                    </div>

                </div>

                {/* Footer */}

                <div
                    className="
                        mt-8
                        flex
                        items-center
                        justify-between
                        border-t
                        border-white/5
                        pt-6
                    "
                >

                    <div className="text-gray-500 text-sm">

                        Kliknij kartę aby rozwinąć edytor lekcji.

                    </div>

                    <button

                        onClick={() => toggle(lesson.id)}

                        className="
                            flex
                            items-center
                            gap-2
                            text-cyan-400
                            font-semibold
                            hover:text-cyan-300
                            transition
                        "

                    >

                        {

                            expanded

                                ? "Ukryj edytor"

                                : "Otwórz edytor"

                        }

                        <BsArrowRight/>

                    </button>

                </div>

            </div>

            {

                expanded && (

                    <div
                        className="
                            border-t
                            border-white/10
                            bg-black/20
                            backdrop-blur-xl
                            p-8
                        "
                    >

                        <BlockManager

                            lessonId={lesson.id}

                            lessonBlocks={lessonBlocks}
                            variant={variant}

                        />

                    </div>

                )

            }

        </div>

    );

}

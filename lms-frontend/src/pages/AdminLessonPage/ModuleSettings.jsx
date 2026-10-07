import {
    BsCollection,
    BsLockFill,
    BsUnlockFill,
    BsSave,
    BsStars,
    BsLightningChargeFill
} from "react-icons/bs";

export default function ModuleSettings({

                                           moduleSettings,
                                           setModuleSettings,
                                           onSave

                                       }) {

    return (

        <section
            className="
                relative
                overflow-hidden
                rounded-[36px]
                border
                border-cyan-500/20
                bg-gradient-to-br
                from-slate-950
                via-[#081325]
                to-cyan-950
                p-8
            "
        >

            <div className="
                absolute
                -right-20
                -top-20
                w-80
                h-80
                rounded-full
                bg-cyan-500/10
                blur-3xl
            "/>

            <div className="relative z-10 space-y-8">

                {/* HEADER */}

                <div className="flex justify-between items-center">

                    <div>

                        <div className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-full
                            bg-cyan-500/10
                            border
                            border-cyan-500/20
                            px-5
                            py-2
                            text-cyan-300
                            font-semibold
                        ">

                            <BsStars />

                            EDUHUB 2026

                        </div>

                        <h2 className="text-4xl font-black mt-6">

                            Ustawienia modułu

                        </h2>

                        <p className="text-gray-400 mt-4 max-w-2xl">

                            Skonfiguruj nazwę modułu oraz sposób
                            odblokowywania kolejnych lekcji.

                        </p>

                    </div>

                    <div
                        className={`
                            w-20
                            h-20
                            rounded-3xl
                            flex
                            items-center
                            justify-center
                            text-3xl

                            ${
                            moduleSettings.lessonsLocked
                                ? "bg-orange-500/10 text-orange-300"
                                : "bg-green-500/10 text-green-300"
                        }
                        `}
                    >

                        {

                            moduleSettings.lessonsLocked
                                ? <BsLockFill/>
                                : <BsUnlockFill/>

                        }

                    </div>

                </div>

                {/* NAME */}

                <div
                    className="
                        rounded-3xl
                        border
                        border-white/10
                        bg-white/[0.04]
                        backdrop-blur-xl
                        p-6
                    "
                >

                    <label
                        className="
                            flex
                            items-center
                            gap-3
                            text-cyan-300
                            font-semibold
                            mb-5
                        "
                    >

                        <BsCollection/>

                        Nazwa modułu

                    </label>

                    <input

                        value={moduleSettings.name || ""}

                        onChange={(e)=>

                            setModuleSettings(prev=>({

                                ...prev,

                                name:e.target.value

                            }))

                        }

                        placeholder="np. Java Podstawy"

                        className="
                            w-full
                            rounded-2xl
                            border
                            border-white/10
                            bg-black/20
                            px-5
                            py-4
                            outline-none
                            focus:border-cyan-500
                            transition
                        "

                    />

                </div>

                {/* LOCK */}

                <div
                    className="
                        rounded-3xl
                        border
                        border-white/10
                        bg-white/[0.04]
                        backdrop-blur-xl
                        p-6
                    "
                >

                    <div className="flex justify-between items-center">

                        <div>

                            <div className="font-bold text-xl">

                                Blokowanie lekcji

                            </div>

                            <p className="text-gray-400 mt-2">

                                Następna lekcja odblokuje się
                                dopiero po ukończeniu poprzedniej.

                            </p>

                        </div>

                        <button

                            type="button"

                            onClick={()=>

                                setModuleSettings(prev=>({

                                    ...prev,

                                    lessonsLocked: !prev.lessonsLocked

                                }))

                            }

                            className={`
                                relative
                                w-20
                                h-11
                                rounded-full
                                transition

                                ${
                                moduleSettings.lessonsLocked

                                    ? "bg-cyan-500"

                                    : "bg-gray-700"
                            }
                            `}
                        >

                            <span
                                className={`
                                    absolute
                                    top-1
                                    w-9
                                    h-9
                                    rounded-full
                                    bg-white
                                    transition-all

                                    ${
                                    moduleSettings.lessonsLocked

                                        ? "left-10"

                                        : "left-1"
                                }
                                `}
                            />

                        </button>

                    </div>

                </div>

                {/* SAVE */}

                <button

                    onClick={onSave}

                    className="
                        w-full
                        rounded-2xl
                        bg-gradient-to-r
                        from-cyan-500
                        to-blue-600
                        py-5
                        font-bold
                        text-lg
                        flex
                        justify-center
                        items-center
                        gap-3
                        hover:scale-[1.01]
                        transition
                        shadow-[0_20px_60px_rgba(6,182,212,0.25)]
                    "

                >

                    <BsSave/>

                    Zapisz ustawienia modułu

                    <BsLightningChargeFill/>

                </button>

            </div>

        </section>

    );

}
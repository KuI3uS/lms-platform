import {
    BsBook,
    BsCardText,
    BsCodeSlash,
    BsImage,
    BsStars,
    BsLightningChargeFill,
    BsSave
} from "react-icons/bs";

export default function LessonForm({
                                       form,
                                       setForm,
                                       editingId,
                                       onCreate,
                                       onUpdate
                                   }) {

    return (

        <section
            className="
                relative
                overflow-hidden
                rounded-[40px]
                border
                border-cyan-500/20
                bg-gradient-to-br
                from-slate-950
                via-[#081325]
                to-cyan-950
                p-10
            "
        >

            {/* BACKGROUND */}

            <div
                className="
                    absolute
                    -top-28
                    -right-28
                    w-[420px]
                    h-[420px]
                    rounded-full
                    bg-cyan-500/10
                    blur-3xl
                "
            />

            <div
                className="
                    absolute
                    -bottom-28
                    -left-28
                    w-[380px]
                    h-[380px]
                    rounded-full
                    bg-blue-600/10
                    blur-3xl
                "
            />

            <div className="relative z-10 space-y-10">

                {/* ================================================= */}

                {/* HERO */}

                {/* ================================================= */}

                <div>

                    <div
                        className="
                            inline-flex
                            items-center
                            gap-2
                            rounded-full
                            border
                            border-cyan-500/20
                            bg-cyan-500/10
                            px-5
                            py-2
                            text-cyan-300
                            font-semibold
                        "
                    >

                        <BsStars />

                        EDUHUB 2026

                    </div>

                    <h1
                        className="
                            mt-8
                            text-5xl
                            font-black
                        "
                    >

                        {editingId
                            ? "Edytuj lekcję"
                            : "Nowa lekcja"}

                    </h1>

                    <p
                        className="
                            mt-6
                            max-w-3xl
                            text-lg
                            leading-8
                            text-gray-300
                        "
                    >

                        Twórz profesjonalne lekcje,
                        dodawaj teorię,
                        przykłady,
                        zadania,
                        quizy,
                        multimedia
                        oraz projekty.

                    </p>

                </div>

                {/* ================================================= */}

                {/* TYTUŁ LEKCJI */}

                {/* ================================================= */}

                <div
                    className="
                        rounded-3xl
                        border
                        border-white/10
                        bg-white/[0.04]
                        backdrop-blur-xl
                        p-7
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

                        <BsBook size={20} />

                        Tytuł lekcji

                    </label>

                    <input
                        value={form.title || ""}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                title: e.target.value
                            })
                        }
                        placeholder="np. Czym jest programowanie?"
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
                    {/* ================================================= */}

                    {/* OPIS LEKCJI */}

                    {/* ================================================= */}

                    <div
                        className="
                        rounded-3xl
                        border
                        border-white/10
                        bg-white/[0.04]
                        backdrop-blur-xl
                        p-7
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

                            <BsCardText size={20} />

                            Opis lekcji

                        </label>

                        <textarea

                            value={form.theory || ""}

                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    theory: e.target.value
                                })
                            }

                            placeholder="Wyjaśnij czego użytkownik nauczy się w tej lekcji..."

                            className="
                            w-full
                            min-h-44
                            rounded-2xl
                            border
                            border-white/10
                            bg-black/20
                            px-5
                            py-4
                            resize-none
                            outline-none
                            focus:border-cyan-500
                            transition
                        "

                        />

                    </div>

                    {/* ================================================= */}

                    {/* PRZYKŁAD KODU */}

                    {/* ================================================= */}

                    <div
                        className="
                        rounded-3xl
                        border
                        border-white/10
                        bg-white/[0.04]
                        backdrop-blur-xl
                        p-7
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

                            <BsCodeSlash size={20} />

                            Przykład kodu

                        </label>

                        <textarea

                            value={form.example || ""}

                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    example: e.target.value
                                })
                            }

                            placeholder={`public class Main {

    public static void main(String[] args) {

        System.out.println("Hello World");

    }

}`}

                            className="
                            w-full
                            min-h-72
                            rounded-2xl
                            border
                            border-white/10
                            bg-black/30
                            px-5
                            py-4
                            font-mono
                            text-[15px]
                            resize-none
                            outline-none
                            focus:border-cyan-500
                            transition
                        "

                        />

                    </div>

                    {/* ================================================= */}

                    {/* DODATKOWE INFORMACJE */}

                    {/* ================================================= */}

                    <div
                        className="
                        rounded-3xl
                        border
                        border-white/10
                        bg-white/[0.04]
                        backdrop-blur-xl
                        p-7
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

                            <BsCardText size={20} />

                            Dodatkowe informacje

                        </label>

                        <textarea

                            value={form.content || ""}

                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    content: e.target.value
                                })
                            }

                            placeholder="Tutaj możesz dodać dodatkowe wskazówki, materiały lub informacje dla kursanta..."

                            className="
                            w-full
                            min-h-56
                            rounded-2xl
                            border
                            border-white/10
                            bg-black/20
                            px-5
                            py-4
                            resize-none
                            outline-none
                            focus:border-cyan-500
                            transition
                        "

                        />

                    </div>
                    {/* ================================================= */}

                    {/* MINIATURA */}

                    {/* ================================================= */}

                    <div
                        className="
                        rounded-3xl
                        border
                        border-white/10
                        bg-white/[0.04]
                        backdrop-blur-xl
                        p-7
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

                            <BsImage size={20} />

                            Miniatura lekcji

                        </label>

                        <input

                            value={form.imageUrl || ""}

                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    imageUrl: e.target.value
                                })
                            }

                            placeholder="https://..."

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

                        {form.imageUrl && (

                            <img
                                src={form.imageUrl}
                                alt="Preview"
                                className="
                                mt-6
                                w-full
                                max-h-80
                                rounded-2xl
                                object-cover
                                border
                                border-white/10
                            "
                            />

                        )}

                    </div>

                    {/* ================================================= */}

                    {/* USTAWIENIA */}

                    {/* ================================================= */}

                    <div className="grid lg:grid-cols-2 gap-6">

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

                                    <h3 className="font-bold text-lg">

                                        Opublikowana

                                    </h3>

                                    <p className="text-gray-400 mt-2">

                                        Lekcja będzie widoczna dla użytkowników.

                                    </p>

                                </div>

                                <button

                                    type="button"

                                    onClick={() =>
                                        setForm({
                                            ...form,
                                            published: !form.published
                                        })
                                    }

                                    className={`
                                    relative
                                    w-20
                                    h-11
                                    rounded-full
                                    transition

                                    ${
                                        form.published
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
                                        transition

                                        ${
                                        form.published
                                            ? "left-10"
                                            : "left-1"
                                    }
                                    `}
                                />

                                </button>

                            </div>

                        </div>

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

                                    <h3 className="font-bold text-lg">

                                        Darmowy podgląd

                                    </h3>

                                    <p className="text-gray-400 mt-2">

                                        Lekcja będzie dostępna bez zakupu kursu.

                                    </p>

                                </div>

                                <button

                                    type="button"

                                    onClick={() =>
                                        setForm({
                                            ...form,
                                            freePreview: !form.freePreview
                                        })
                                    }

                                    className={`
                                    relative
                                    w-20
                                    h-11
                                    rounded-full
                                    transition

                                    ${
                                        form.freePreview
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
                                        transition

                                        ${
                                        form.freePreview
                                            ? "left-10"
                                            : "left-1"
                                    }
                                    `}
                                />

                                </button>

                            </div>

                        </div>

                    </div>

                    {/* ================================================= */}

                    {/* SAVE */}

                    {/* ================================================= */}

                    <button

                        onClick={editingId ? onUpdate : onCreate}

                        className="
                        w-full
                        rounded-2xl
                        bg-gradient-to-r
                        from-cyan-500
                        to-blue-600
                        py-5
                        text-lg
                        font-bold
                        flex
                        items-center
                        justify-center
                        gap-3
                        hover:scale-[1.01]
                        transition
                        shadow-[0_20px_60px_rgba(6,182,212,0.25)]
                    "

                    >

                        <BsSave size={22} />

                        {

                            editingId

                                ? "Zapisz lekcję"

                                : "Utwórz lekcję"

                        }

                        <BsLightningChargeFill size={20} />

                    </button>

                </div>

            </div>

        </section>

);

}

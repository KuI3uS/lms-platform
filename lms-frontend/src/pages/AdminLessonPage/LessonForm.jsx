import {
    BsBook,
    BsCardText,
    BsCodeSlash,
    BsImage,
    BsCheckCircle,
    BsEye
} from "react-icons/bs";

export default function LessonForm({
                                       form,
                                       setForm,
                                       editingId,
                                       onCreate,
                                       onUpdate
                                   }) {

    return (

        <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-6">

            <div>

                <h2 className="text-2xl font-bold">
                    {editingId ? "Edycja lekcji" : "Nowa lekcja"}
                </h2>

                <p className="text-gray-400 mt-1">
                    Utwórz lekcję. Jej zawartość dodasz później za pomocą bloków.
                </p>

            </div>

            {/* Nazwa */}

            <div className="space-y-2">

                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">

                    <BsBook />

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
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
                />

            </div>

            {/* Opis */}

            <div className="space-y-2">

                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">

                    <BsCardText />

                    Krótki opis lekcji

                </label>

                <textarea
                    value={form.theory || ""}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            theory: e.target.value
                        })
                    }
                    placeholder="Opis lekcji wyświetlany na początku..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 min-h-32"
                />

            </div>

            {/* Przykład */}

            <div className="space-y-2">

                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">

                    <BsCodeSlash />

                    Przykład startowy (opcjonalnie)

                </label>

                <textarea
                    value={form.example || ""}
                    onChange={(e) =>
                        setForm({
                            ...form,
                            example: e.target.value
                        })
                    }
                    placeholder="Kod startowy..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 min-h-52 font-mono"
                />

            </div>

            {/* Dodatkowy opis */}

            <div className="space-y-2">

                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">

                    <BsCardText />

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
                    placeholder="Opcjonalna treść..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 min-h-40"
                />

            </div>

            {/* Obraz */}

            <div className="space-y-2">

                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">

                    <BsImage />

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
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
                />

            </div>

            {/* Opcje */}

            <div className="grid md:grid-cols-2 gap-4">

                <label className="flex items-center gap-3 bg-gray-800 rounded-xl p-4 cursor-pointer">

                    <input
                        type="checkbox"
                        checked={form.published ?? true}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                published: e.target.checked
                            })
                        }
                    />

                    <BsCheckCircle />

                    Opublikowana

                </label>

                <label className="flex items-center gap-3 bg-gray-800 rounded-xl p-4 cursor-pointer">

                    <input
                        type="checkbox"
                        checked={form.freePreview ?? false}
                        onChange={(e) =>
                            setForm({
                                ...form,
                                freePreview: e.target.checked
                            })
                        }
                    />

                    <BsEye />

                    Darmowy podgląd

                </label>

            </div>

            <button
                onClick={editingId ? onUpdate : onCreate}
                className="w-full bg-green-600 hover:bg-green-700 rounded-xl py-3 font-bold transition"
            >
                {editingId ? "Zapisz zmiany" : "Utwórz lekcję"}
            </button>

        </section>

    );

}
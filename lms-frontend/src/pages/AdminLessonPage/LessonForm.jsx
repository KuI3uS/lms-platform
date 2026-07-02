export default function LessonForm({
                                       form,
                                       setForm,
                                       editingId,
                                       onCreate,
                                       onUpdate
                                   }) {
    return (
        <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-4">

            <div>
                <h2 className="text-2xl font-bold">
                    {editingId ? "Edytuj lekcję" : "Dodaj nową lekcję"}
                </h2>

                <p className="text-gray-400 mt-1">
                    Podstawowe dane lekcji. Treść właściwą będziemy budować blokami.
                </p>
            </div>

            <input
                placeholder="Tytuł lekcji"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 outline-none focus:border-blue-500"
            />

            <textarea
                placeholder="Krótka teoria / opis lekcji"
                value={form.theory || ""}
                onChange={e => setForm({ ...form, theory: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 min-h-32 outline-none focus:border-blue-500"
            />

            <textarea
                placeholder="Przykład startowy"
                value={form.example || ""}
                onChange={e => setForm({ ...form, example: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 min-h-32 font-mono outline-none focus:border-blue-500"
            />

            <textarea
                placeholder="Dodatkowa treść"
                value={form.content || ""}
                onChange={e => setForm({ ...form, content: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 min-h-40 outline-none focus:border-blue-500"
            />

            <input
                placeholder="URL obrazka lekcji"
                value={form.imageUrl || ""}
                onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 outline-none focus:border-blue-500"
            />

            <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 bg-gray-800 px-4 py-3 rounded-2xl cursor-pointer">
                    <input
                        type="checkbox"
                        checked={form.published || false}
                        onChange={e =>
                            setForm({ ...form, published: e.target.checked })
                        }
                    />
                    Opublikowana
                </label>

                <label className="flex items-center gap-2 bg-gray-800 px-4 py-3 rounded-2xl cursor-pointer">
                    <input
                        type="checkbox"
                        checked={form.freePreview || false}
                        onChange={e =>
                            setForm({ ...form, freePreview: e.target.checked })
                        }
                    />
                    Darmowy podgląd
                </label>
            </div>

            <button
                onClick={editingId ? onUpdate : onCreate}
                className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-2xl font-bold"
            >
                {editingId ? "Zapisz lekcję" : "Dodaj lekcję"}
            </button>

        </section>
    );
}
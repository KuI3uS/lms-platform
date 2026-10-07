import {
    BsCheckCircle,
    BsStar,
    BsSave
} from "react-icons/bs";

export default function BlockFooter({
                                        block,
                                        setBlock,
                                        onSave
                                    }) {

    return (

        <div className="space-y-6 pt-6 border-t border-gray-800">

            <div className="grid md:grid-cols-2 gap-4">

                <label className="flex items-center gap-3 bg-gray-800 rounded-2xl p-4 cursor-pointer">

                    <input
                        type="checkbox"
                        checked={block.published ?? true}
                        onChange={(e) =>
                            setBlock(prev => ({
                                ...prev,
                                published: e.target.checked
                            }))
                        }
                    />

                    <div>

                        <div className="flex items-center gap-2 font-semibold">

                            <BsCheckCircle />

                            Opublikowany

                        </div>

                        <div className="text-sm text-gray-400">

                            Widoczny dla użytkowników.

                        </div>

                    </div>

                </label>

                <div className="bg-gray-800 rounded-2xl p-4">

                    <label className="flex items-center gap-2 text-sm text-gray-300 mb-3">

                        <BsStar />

                        Punkty (XP)

                    </label>

                    <input
                        type="number"
                        min={0}
                        value={block.points ?? 0}
                        onChange={(e) =>
                            setBlock(prev => ({
                                ...prev,
                                points: Number(e.target.value)
                            }))
                        }
                        className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3"
                    />

                </div>

            </div>

            <button
                type="button"
                onClick={onSave}
                className="w-full bg-blue-600 hover:bg-blue-700 rounded-2xl py-4 font-bold flex items-center justify-center gap-3 transition"
            >

                <BsSave />

                {block.id
                    ? "Zapisz zmiany"
                    : "Dodaj element"}

            </button>

        </div>

    );

}
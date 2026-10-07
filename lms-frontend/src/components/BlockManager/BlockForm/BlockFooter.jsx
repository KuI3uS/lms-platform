import {
    BsCheckCircle,
    BsStar,
    BsSave
} from "react-icons/bs";
import { DEFAULT_EXERCISE_XP, REWARDED_BLOCK_TYPES } from "../../../utils/lessonBlockRewards";

export default function BlockFooter({
                                        block,
                                        setBlock,
                                        onSave,
                                        saving = false
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
                    <p className="mt-2 text-xs leading-5 text-gray-400">
                        {REWARDED_BLOCK_TYPES.has(block.type)
                            ? `Nagroda za pierwsze zaliczenie ćwiczenia. Wartość 0 oznacza domyślne ${DEFAULT_EXERCISE_XP} XP.`
                            : "Ten blok jest materiałem do nauki. XP otrzymuje się za ćwiczenia i ukończenie lekcji."}
                    </p>

                </div>

            </div>

            <button
                type="button"
                disabled={saving}
                onClick={onSave}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 py-4 font-bold transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
            >

                <BsSave />

                {saving
                    ? "Zapisywanie..."
                    : block.id
                        ? "Zapisz zmiany"
                        : "Dodaj element"}

            </button>

        </div>

    );

}

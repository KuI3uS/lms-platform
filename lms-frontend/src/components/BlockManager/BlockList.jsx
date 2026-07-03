import {
    BsPencilSquare,
    BsTrash,
    BsGripVertical
} from "react-icons/bs";

import {
    getBlockIcon,
    getBlockLabel
} from "./blockTypes";

export default function BlockList({
                                      lessonId,
                                      blocks = [],
                                      onEdit,
                                      onDelete
                                  }) {

    if (blocks.length === 0) {

        return (

            <div className="bg-gray-900 border border-dashed border-gray-700 rounded-3xl p-10 text-center">

                <div className="text-5xl mb-4">
                    📚
                </div>

                <h3 className="text-xl font-bold">
                    Lekcja jest pusta
                </h3>

                <p className="text-gray-500 mt-2">
                    Wybierz typ bloku poniżej i dodaj pierwszy element lekcji.
                </p>

            </div>

        );

    }

    return (

        <div className="space-y-3">

            {blocks
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((block, index) => (

                    <div
                        key={block.id}
                        className="group bg-gray-900 border border-gray-800 hover:border-blue-500 rounded-2xl p-4 transition"
                    >

                        <div className="flex items-center justify-between">

                            {/* Lewa strona */}

                            <div className="flex items-center gap-4 flex-1">

                                <div className="text-gray-500 cursor-grab">

                                    <BsGripVertical />

                                </div>

                                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-xl">

                                    {getBlockIcon(block.type)}

                                </div>

                                <div className="flex-1">

                                    <div className="flex items-center gap-2">

                                        <span className="text-gray-500 font-semibold">

                                            {index + 1}.

                                        </span>

                                        <span className="font-bold text-white">

                                            {block.title || "Bez tytułu"}

                                        </span>

                                    </div>

                                    <div className="mt-1 text-sm text-gray-400">

                                        {getBlockLabel(block.type)}

                                    </div>

                                </div>

                            </div>

                            {/* Prawa strona */}

                            <div className="flex items-center gap-2">

                                <button
                                    type="button"
                                    onClick={() => onEdit(lessonId, block)}
                                    className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-blue-600 transition flex items-center justify-center"
                                >

                                    <BsPencilSquare />

                                </button>

                                <button
                                    type="button"
                                    onClick={() => onDelete(lessonId, block.id)}
                                    className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-red-600 transition flex items-center justify-center"
                                >

                                    <BsTrash />

                                </button>

                            </div>

                        </div>

                    </div>

                ))}

        </div>

    );

}
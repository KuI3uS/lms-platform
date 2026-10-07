import {
    BsCardText,
    BsImage,
    BsCodeSlash,
    BsPlayBtn,
    BsQuestionCircle,
    BsDownload,
    BsQuote,
    BsDashLg,
    BsLightbulb,
    BsExclamationTriangle,
    BsInfoCircle,
    BsCheckCircle,
    BsPencilSquare,
    BsTrash
} from "react-icons/bs";

const icons = {
    TEXT: <BsCardText />,
    TIP: <BsLightbulb />,
    WARNING: <BsExclamationTriangle />,
    SUMMARY: <BsCheckCircle />,
    INFO: <BsInfoCircle />,
    IMAGE: <BsImage />,
    EXAMPLE: <BsCodeSlash />,
    VIDEO: <BsPlayBtn />,
    QUIZ: <BsQuestionCircle />,
    TASK: <BsCodeSlash />,
    DOWNLOAD: <BsDownload />,
    DIVIDER: <BsDashLg />,
    QUOTE: <BsQuote />
};

export default function BlockList({
                                      blocks = [],
                                      onEdit,
                                      onDelete
                                  }) {

    return (

        <div className="space-y-3">

            {blocks.length === 0 ? (

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center text-gray-500">
                    Ta lekcja nie posiada jeszcze żadnych bloków.
                </div>

            ) : (

                blocks
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map(block => (

                        <div
                            key={block.id}
                            className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-center justify-between"
                        >

                            <div className="flex items-center gap-4">

                                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">

                                    {icons[block.type]}

                                </div>

                                <div>

                                    <div className="font-bold">

                                        {block.orderIndex}. {block.title || "Bez tytułu"}

                                    </div>

                                    <div className="text-sm text-gray-400">

                                        {block.type}

                                    </div>

                                </div>

                            </div>

                            <div className="flex gap-2">

                                <button
                                    onClick={() => onEdit?.(block)}
                                    className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center"
                                >
                                    <BsPencilSquare />
                                </button>

                                <button
                                    onClick={() => onDelete?.(block.id)}
                                    className="w-10 h-10 rounded-xl bg-red-600 hover:bg-red-700 flex items-center justify-center"
                                >
                                    <BsTrash />
                                </button>

                            </div>

                        </div>

                    ))

            )}

        </div>

    );

}
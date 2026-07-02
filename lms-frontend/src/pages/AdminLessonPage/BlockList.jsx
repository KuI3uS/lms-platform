export default function BlockList({ blocks }) {

    return (

        <div className="bg-gray-900 rounded-xl p-4">

            <h3 className="font-bold text-blue-400 mb-3">
                Bloki lekcji
            </h3>

            {blocks.length === 0
                ? (
                    <p className="text-gray-500">
                        Brak bloków.
                    </p>
                )
                : (
                    blocks.map(block => (

                        <div
                            key={block.id}
                            className="py-2 border-b border-gray-800"
                        >
                            {block.orderIndex}. {block.type} — {block.title}
                        </div>

                    ))
                )}

        </div>

    );

}
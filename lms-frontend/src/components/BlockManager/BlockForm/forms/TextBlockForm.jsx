export default function TextBlockForm({
                                          block,
                                          setBlock
                                      }) {

    return (

        <textarea
            value={block.content || ""}
            placeholder="Treść..."
            onChange={(e) =>
                setBlock(prev => ({
                    ...prev,
                    content: e.target.value
                }))
            }
            className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 min-h-56 resize-y"
        />

    );

}
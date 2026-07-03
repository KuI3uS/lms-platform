export default function QuoteBlockForm({
                                           block,
                                           setBlock
                                       }) {

    return (

        <textarea
            value={block.content || ""}
            placeholder="Treść cytatu..."
            onChange={(e)=>
                setBlock(prev=>({
                    ...prev,
                    content:e.target.value
                }))
            }
            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 min-h-40"
        />

    );

}
export default function ExampleBlockForm({
                                             block,
                                             setBlock
                                         }) {

    return (

        <div className="space-y-4">

            <input
                value={block.language || "java"}
                placeholder="Język"
                onChange={(e)=>
                    setBlock(prev=>({
                        ...prev,
                        language:e.target.value
                    }))
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
            />

            <textarea
                value={block.content || ""}
                placeholder="Kod..."
                onChange={(e)=>
                    setBlock(prev=>({
                        ...prev,
                        content:e.target.value
                    }))
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 min-h-96 font-mono"
            />

        </div>

    );

}
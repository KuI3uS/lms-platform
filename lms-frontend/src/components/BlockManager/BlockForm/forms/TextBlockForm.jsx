export default function TextBlockForm({
                                          block,
                                          setBlock
                                      }) {

    return (

        <div className="space-y-5">

            <div>

                <label className="block mb-2 font-semibold">
                    Tytuł bloku
                </label>

                <input
                    value={block.title || ""}
                    placeholder="Np. Czym jest programowanie?"
                    onChange={(e) =>
                        setBlock(prev => ({
                            ...prev,
                            title: e.target.value
                        }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
                />

            </div>

            <div>

                <label className="block mb-2 font-semibold">
                    Treść
                </label>

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

            </div>

        </div>

    );

}
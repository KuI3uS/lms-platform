export default function VideoBlockForm({
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
                    placeholder="Np. Film wyjaśniający"
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
                    Link do filmu
                </label>

                <input
                    value={block.mediaUrl || ""}
                    placeholder="https://youtube.com/..."
                    onChange={(e) =>
                        setBlock(prev => ({
                            ...prev,
                            mediaUrl: e.target.value,
                            mediaType: "video"
                        }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
                />

            </div>

        </div>

    );

}
export default function DownloadBlockForm({
                                              block,
                                              setBlock
                                          }) {

    return (

        <input
            value={block.mediaUrl || ""}
            placeholder="Link do pliku"
            onChange={(e)=>
                setBlock(prev=>({
                    ...prev,
                    mediaUrl:e.target.value,
                    mediaType:"file"
                }))
            }
            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
        />

    );

}
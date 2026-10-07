export default function VideoBlockForm({
                                           block,
                                           setBlock
                                       }) {

    return (

        <input
            value={block.mediaUrl || ""}
            placeholder="Link do filmu"
            onChange={(e)=>
                setBlock(prev=>({
                    ...prev,
                    mediaUrl:e.target.value,
                    mediaType:"video"
                }))
            }
            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
        />

    );

}
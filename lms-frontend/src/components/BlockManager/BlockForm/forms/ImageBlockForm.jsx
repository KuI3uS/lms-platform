export default function ImageBlockForm({
                                           block,
                                           setBlock
                                       }) {

    return (

        <input
            value={block.mediaUrl || ""}
            placeholder="Adres obrazka"
            onChange={(e)=>
                setBlock(prev=>({
                    ...prev,
                    mediaUrl:e.target.value,
                    mediaType:"image"
                }))
            }
            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
        />

    );

}
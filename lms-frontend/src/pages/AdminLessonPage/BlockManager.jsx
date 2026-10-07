import BlockList from "./BlockList";
import BlockForm from "./BlockForm";

export default function BlockManager(props) {

    return (
        <div className="space-y-4">

            <BlockList
                blocks={props.blocks}
            />

            <BlockForm
                lessonId={props.lessonId}
            />

        </div>
    );

}
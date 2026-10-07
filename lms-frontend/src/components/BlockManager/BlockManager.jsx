import { BsCollection } from "react-icons/bs";

import BlockList from "./BlockList";
import BlockForm from "./BlockForm";

export default function BlockManager({

                                         lessonId,

                                         lessonBlocks,

                                         lessonTasks

                                     }) {

    const blocks = lessonBlocks.getBlocks(lessonId);

    const block = lessonBlocks.getBlockForm(lessonId);

    return (

        <section className="bg-gray-950 border border-gray-800 rounded-3xl p-6 space-y-6">

            <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">

                    <BsCollection />

                </div>

                <div>

                    <h3 className="text-xl font-bold">
                        Bloki lekcji
                    </h3>

                    <p className="text-gray-400 text-sm">
                        Buduj lekcję z tekstów, obrazów, filmów, przykładów oraz zadań.
                    </p>

                </div>

            </div>

            <BlockList

                lessonId={lessonId}

                blocks={blocks}

                onEdit={lessonBlocks.editBlock}

                onDelete={lessonBlocks.deleteBlock}

            />

            <BlockForm

                lessonId={lessonId}

                block={block}

                setBlock={(callback) =>
                    lessonBlocks.setBlock(
                        lessonId,
                        callback
                    )
                }

                tasks={lessonTasks.getTasks(lessonId)}

                onSave={() =>
                    block.id
                        ? lessonBlocks.updateBlock(
                            lessonId,
                            block.id
                        )
                        : lessonBlocks.saveBlock(
                            lessonId
                        )
                }

            />

        </section>

    );

}
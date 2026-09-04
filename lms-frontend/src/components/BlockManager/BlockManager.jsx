import { BsCollection, BsTrash } from "react-icons/bs";

import BlockList from "./BlockList";
import BlockForm from "./BlockForm/BlockForm";
import ChatGptLessonImport from "./ChatGptLessonImport";

export default function BlockManager({

                                         lessonId,

                                         lessonBlocks,
                                         variant = "PROGRAMMING"

                                     }) {

    const blocks = lessonBlocks.getBlocks(lessonId);

    const block = lessonBlocks.getBlockForm(lessonId);

    return (

        <section className="bg-gray-950 border border-gray-800 rounded-3xl p-6 space-y-6">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">

                    <BsCollection />

                </div>

                <div>

                    <h3 className="text-xl font-bold">
                        {variant === "LANGUAGE" ? "Kroki lekcji językowej" : "Bloki lekcji"}
                    </h3>

                    <p className="text-gray-400 text-sm">
                        {variant === "LANGUAGE"
                            ? "Dodawaj tylko krótkie porcje materiału i ćwiczenia utrwalające."
                            : "Buduj lekcję z tekstów, obrazów, filmów, przykładów oraz zadań."}
                    </p>

                </div>

                </div>

                {blocks.length > 0 && (
                    <button
                        type="button"
                        disabled={Boolean(lessonBlocks.deletingAllByLesson?.[lessonId])}
                        onClick={() => lessonBlocks.deleteAllBlocks(lessonId)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2.5 text-sm font-black text-red-200 transition hover:border-red-300/50 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {lessonBlocks.deletingAllByLesson?.[lessonId]
                            ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-transparent" />
                            : <BsTrash />}
                        {lessonBlocks.deletingAllByLesson?.[lessonId]
                            ? "Usuwanie..."
                            : `Usuń wszystkie (${blocks.length})`}
                    </button>
                )}

            </div>

            <BlockList

                lessonId={lessonId}

                blocks={blocks}

                onEdit={lessonBlocks.editBlock}

                onDelete={lessonBlocks.deleteBlock}

            />

            <ChatGptLessonImport
                lessonId={lessonId}
                lessonBlocks={lessonBlocks}
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

                saving={Boolean(lessonBlocks.savingByLesson[lessonId])}
                error={lessonBlocks.errorsByLesson[lessonId] || ""}
                variant={variant}

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

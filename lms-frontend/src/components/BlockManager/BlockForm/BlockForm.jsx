import BlockTypeSelector from "./BlockTypeSelector";
import BlockRenderer from "./BlockRenderer";
import BlockFooter from "./BlockFooter";

export default function BlockForm({
                                      block,
                                      setBlock,
                                      onSave,
                                      tasks = []
                                  }) {

    return (

        <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-6">

            <div>

                <h2 className="text-2xl font-bold">

                    {block.id
                        ? "Edytuj blok"
                        : "Dodaj blok"}

                </h2>

                <p className="text-gray-400 mt-1">

                    Wybierz typ bloku i uzupełnij jego zawartość.

                </p>

            </div>

            <BlockTypeSelector
                value={block.type}
                onChange={(type)=>
                    setBlock(prev=>({
                        ...prev,
                        type
                    }))
                }
            />

            <BlockRenderer
                block={block}
                setBlock={setBlock}
                tasks={tasks}
            />

            <BlockFooter
                block={block}
                setBlock={setBlock}
                onSave={onSave}
            />

        </section>

    );

}
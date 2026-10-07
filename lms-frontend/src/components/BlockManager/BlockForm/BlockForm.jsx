import BlockTypeSelector from "./BlockTypeSelector";
import BlockRenderer from "./BlockRenderer";
import BlockFooter from "./BlockFooter";

export default function BlockForm({
                                      block,
                                      setBlock,
                                      onSave,
                                      saving = false,
                                      error = "",
                                      variant = "PROGRAMMING"
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
                variant={variant}
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
                variant={variant}
            />

            {error && (
                <div
                    role="alert"
                    className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm font-semibold text-red-200"
                >
                    Nie udało się zapisać elementu: {error}
                </div>
            )}

            <BlockFooter
                block={block}
                setBlock={setBlock}
                onSave={onSave}
                saving={saving}
            />

        </section>

    );

}

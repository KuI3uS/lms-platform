import { useLocale } from "../../../context/LocaleContext.jsx";
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
    const { t } = useLocale();

    return (

        <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-6">

            <div>

                <h2 className="text-2xl font-bold">

                    {block.id
                        ? t("Edytuj blok")
                        : t("Dodaj blok")}

                </h2>

                <p className="text-gray-400 mt-1">{t("Wybierz typ bloku i uzupełnij jego zawartość.")}</p>

            </div>

            <BlockTypeSelector
                value={block.type}
                variant={variant}
                onChange={(type)=>
                    setBlock(prev=>({
                        ...prev,
                        type,
                        language: ["AUDIO", "DIALOG", "VOCABULARY", "SENTENCE_BUILDER", "WORD_LAB", "LISTENING"].includes(type)
                            && !/^[a-z]{2}-[A-Z]{2}$/.test(prev.language || "")
                                ? "en-GB"
                                : prev.language
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
                >{t("Nie udało się zapisać elementu: ")}{error}
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

import { useState } from "react";

const BLOCK_TYPES = [
    { value: "TEXT", label: "📘 Tekst" },
    { value: "TIP", label: "💡 Wskazówka" },
    { value: "WARNING", label: "⚠ Ostrzeżenie" },
    { value: "SUMMARY", label: "📄 Podsumowanie" },
    { value: "INFO", label: "ℹ Informacja" },
    { value: "IMAGE", label: "🖼 Obraz" },
    { value: "EXAMPLE", label: "💻 Przykład kodu" },
    { value: "VIDEO", label: "🎥 Film" },
    { value: "QUIZ", label: "❓ Quiz" },
    { value: "TASK", label: "📝 Zadanie" },
    { value: "DOWNLOAD", label: "📥 Plik" },
    { value: "DIVIDER", label: "──────── Separator" },
    { value: "QUOTE", label: "💬 Cytat" }
];

export default function BlockForm({
                                      block,
                                      setBlock,
                                      onSave,
                                      tasks = []
                                  }) {

    const type = block.type || "TEXT";

    return (
        <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-5">

            <div>
                <h3 className="text-2xl font-bold">
                    Dodaj blok
                </h3>

                <p className="text-gray-400 mt-1">
                    Wybierz rodzaj elementu lekcji.
                </p>
            </div>

            <select
                value={type}
                onChange={(e) =>
                    setBlock(prev => ({
                        ...prev,
                        type: e.target.value
                    }))
                }
                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
            >
                {BLOCK_TYPES.map(t => (
                    <option
                        key={t.value}
                        value={t.value}
                    >
                        {t.label}
                    </option>
                ))}
            </select>

            {type !== "DIVIDER" && (
                <input
                    placeholder="Tytuł bloku"
                    value={block.title || ""}
                    onChange={(e) =>
                        setBlock(prev => ({
                            ...prev,
                            title: e.target.value
                        }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
                />
            )}

            {(type === "TEXT" ||
                type === "TIP" ||
                type === "WARNING" ||
                type === "SUMMARY" ||
                type === "INFO") && (

                <textarea
                    placeholder="Treść"
                    value={block.content || ""}
                    onChange={(e) =>
                        setBlock(prev => ({
                            ...prev,
                            content: e.target.value
                        }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 min-h-40"
                />

            )}

            {type === "EXAMPLE" && (
                <>
                    <input
                        placeholder="Język (java)"
                        value={block.language || "java"}
                        onChange={(e) =>
                            setBlock(prev => ({
                                ...prev,
                                language: e.target.value
                            }))
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
                    />

                    <textarea
                        placeholder="Kod"
                        value={block.content || ""}
                        onChange={(e) =>
                            setBlock(prev => ({
                                ...prev,
                                content: e.target.value
                            }))
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 min-h-72 font-mono"
                    />
                </>
            )}

            {type === "IMAGE" && (
                <>
                    <input
                        placeholder="URL obrazka"
                        value={block.content || ""}
                        onChange={(e) =>
                            setBlock(prev => ({
                                ...prev,
                                content: e.target.value
                            }))
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
                    />

                    <input
                        placeholder="Opis ALT"
                        value={block.alt || ""}
                        onChange={(e) =>
                            setBlock(prev => ({
                                ...prev,
                                alt: e.target.value
                            }))
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
                    />
                </>
            )}

            {type === "VIDEO" && (
                <input
                    placeholder="Link YouTube"
                    value={block.content || ""}
                    onChange={(e) =>
                        setBlock(prev => ({
                            ...prev,
                            content: e.target.value
                        }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
                />
            )}

            {type === "DOWNLOAD" && (
                <>
                    <input
                        placeholder="Nazwa pliku"
                        value={block.fileName || ""}
                        onChange={(e) =>
                            setBlock(prev => ({
                                ...prev,
                                fileName: e.target.value
                            }))
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
                    />

                    <input
                        placeholder="Link do pliku"
                        value={block.content || ""}
                        onChange={(e) =>
                            setBlock(prev => ({
                                ...prev,
                                content: e.target.value
                            }))
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
                    />
                </>
            )}

            {type === "QUOTE" && (
                <>
                    <input
                        placeholder="Autor"
                        value={block.author || ""}
                        onChange={(e) =>
                            setBlock(prev => ({
                                ...prev,
                                author: e.target.value
                            }))
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
                    />

                    <textarea
                        placeholder="Treść cytatu"
                        value={block.content || ""}
                        onChange={(e) =>
                            setBlock(prev => ({
                                ...prev,
                                content: e.target.value
                            }))
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 min-h-32"
                    />
                </>
            )}

            {type === "TASK" && (
                <select
                    value={block.taskId || ""}
                    onChange={(e) =>
                        setBlock(prev => ({
                            ...prev,
                            taskId: Number(e.target.value)
                        }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
                >
                    <option value="">
                        Wybierz zadanie
                    </option>

                    {tasks.map(task => (
                        <option
                            key={task.id}
                            value={task.id}
                        >
                            {task.taskContent}
                        </option>
                    ))}
                </select>
            )}

            {type === "DIVIDER" && (
                <div className="bg-gray-800 rounded-xl p-6 text-center text-gray-400">
                    Separator nie wymaga konfiguracji.
                </div>
            )}

            <button
                onClick={onSave}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-2xl font-bold"
            >
                Zapisz blok
            </button>

        </section>
    );
}
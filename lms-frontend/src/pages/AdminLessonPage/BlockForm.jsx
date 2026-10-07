import {
    BsCardText,
    BsLightbulb,
    BsExclamationTriangle,
    BsInfoCircle,
    BsCheckCircle,
    BsImage,
    BsCodeSlash,
    BsPlayBtn,
    BsQuestionCircle,
    BsDownload,
    BsQuote,
    BsDashLg
} from "react-icons/bs";

const BLOCK_TYPES = [
    { value: "TEXT", label: "Tekst", icon: <BsCardText /> },
    { value: "TIP", label: "Wskazówka", icon: <BsLightbulb /> },
    { value: "WARNING", label: "Ostrzeżenie", icon: <BsExclamationTriangle /> },
    { value: "SUMMARY", label: "Podsumowanie", icon: <BsCheckCircle /> },
    { value: "INFO", label: "Informacja", icon: <BsInfoCircle /> },
    { value: "IMAGE", label: "Obraz", icon: <BsImage /> },
    { value: "EXAMPLE", label: "Przykład kodu", icon: <BsCodeSlash /> },
    { value: "VIDEO", label: "Film", icon: <BsPlayBtn /> },
    { value: "QUIZ", label: "Quiz", icon: <BsQuestionCircle /> },
    { value: "TASK", label: "Zadanie", icon: <BsCodeSlash /> },
    { value: "DOWNLOAD", label: "Plik", icon: <BsDownload /> },
    { value: "DIVIDER", label: "Separator", icon: <BsDashLg /> },
    { value: "QUOTE", label: "Cytat", icon: <BsQuote /> }
];

export default function BlockForm({
                                      block,
                                      setBlock,
                                      onSave,
                                      tasks = []
                                  }) {

    const type = block.type || "TEXT";

    return (

        <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-6">

            <div>

                <h2 className="text-2xl font-bold">
                    Dodaj blok
                </h2>

                <p className="text-gray-400 mt-1">
                    Bloki budują całą zawartość lekcji.
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

                {BLOCK_TYPES.map(item => (

                    <option
                        key={item.value}
                        value={item.value}
                    >
                        {item.label}
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
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 min-h-44"
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
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 min-h-80 font-mono"
                    />

                </>

            )}

            {type === "IMAGE" && (

                <input
                    placeholder="Adres URL obrazka"
                    value={block.mediaUrl || ""}
                    onChange={(e) =>
                        setBlock(prev => ({
                            ...prev,
                            mediaUrl: e.target.value,
                            mediaType: "image"
                        }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
                />

            )}

            {type === "VIDEO" && (

                <input
                    placeholder="Link YouTube lub MP4"
                    value={block.mediaUrl || ""}
                    onChange={(e) =>
                        setBlock(prev => ({
                            ...prev,
                            mediaUrl: e.target.value,
                            mediaType: "video"
                        }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
                />

            )}

            {type === "DOWNLOAD" && (

                <input
                    placeholder="Link do pliku"
                    value={block.mediaUrl || ""}
                    onChange={(e) =>
                        setBlock(prev => ({
                            ...prev,
                            mediaUrl: e.target.value,
                            mediaType: "file"
                        }))
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
                />

            )}

            {type === "QUOTE" && (

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

                <div className="bg-gray-800 rounded-xl p-6 text-center text-gray-500">

                    Separator nie wymaga konfiguracji.

                </div>

            )}

            <div className="grid md:grid-cols-2 gap-4">

                <label className="flex items-center gap-3 bg-gray-800 rounded-xl p-3">

                    <input
                        type="checkbox"
                        checked={block.published ?? true}
                        onChange={(e) =>
                            setBlock(prev => ({
                                ...prev,
                                published: e.target.checked
                            }))
                        }
                    />

                    Opublikowany

                </label>

                <input
                    type="number"
                    min={0}
                    placeholder="Punkty"
                    value={block.points ?? 0}
                    onChange={(e) =>
                        setBlock(prev => ({
                            ...prev,
                            points: Number(e.target.value)
                        }))
                    }
                    className="bg-gray-800 border border-gray-700 rounded-xl p-3"
                />

            </div>

            <button
                onClick={onSave}
                className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl py-3 font-bold transition"
            >
                Zapisz blok
            </button>

        </section>

    );

}
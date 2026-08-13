import { BsCheck2Circle } from "react-icons/bs";
import { getBlockTypes } from "../blockTypes.jsx";

export default function BlockTypeSelector({ value, onChange, variant = "PROGRAMMING" }) {
    const blockTypes = getBlockTypes(variant);
    return (
        <section className="space-y-4">
            <div>
                <h3 className="text-lg font-semibold">Typ bloku</h3>
                <p className="mt-1 text-sm text-gray-400">
                    {variant === "LANGUAGE"
                        ? "Wyświetlamy tylko elementy potrzebne do krótkiej lekcji językowej."
                        : "Każdy element ma własny wygląd i pola dopasowane do swojej roli."}
                </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {blockTypes.map(type => {
                    const selected = value === type.value
                        || (value === "DOWNLOAD" && type.value === "PDF");

                    return (
                        <button
                            key={type.value}
                            type="button"
                            onClick={() => onChange(type.value)}
                            className={`group relative min-h-40 rounded-2xl border p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:brightness-125 ${type.surface} ${type.border} ${
                                selected
                                    ? `${type.selected} shadow-lg`
                                    : "hover:border-white/25"
                            }`}
                        >
                            {selected && (
                                <BsCheck2Circle
                                    className="absolute right-4 top-4 text-white"
                                    size={19}
                                />
                            )}

                            <div className={`grid h-11 w-11 place-items-center rounded-xl text-xl transition-transform group-hover:scale-105 ${type.iconBox}`}>
                                {type.icon}
                            </div>

                            <span className="mt-4 block font-black text-white">
                                {type.label}
                            </span>
                            <span className="mt-1.5 block text-xs leading-5 text-gray-400">
                                {type.description}
                            </span>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

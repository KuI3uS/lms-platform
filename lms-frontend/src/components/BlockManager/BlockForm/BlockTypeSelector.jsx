import { BLOCK_TYPES } from "../blockTypes.jsx";

export default function BlockTypeSelector({
                                              value,
                                              onChange
                                          }) {

    return (

        <section className="space-y-4">

            <div>

                <h3 className="text-lg font-semibold">
                    Typ bloku
                </h3>

                <p className="text-sm text-gray-400 mt-1">
                    Wybierz element, który chcesz dodać do lekcji.
                </p>

            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">

                {BLOCK_TYPES.map(type => (

                    <button
                        key={type.value}
                        type="button"
                        onClick={() => onChange(type.value)}
                        className={`
                            group
                            border
                            rounded-2xl
                            p-4
                            transition-all
                            duration-200
                            flex
                            flex-col
                            items-center
                            justify-center
                            gap-3

                            ${
                            value === type.value
                                ? "bg-blue-600 border-blue-500 shadow-lg shadow-blue-900/30"
                                : "bg-gray-800 border-gray-700 hover:border-blue-500 hover:bg-gray-750"
                        }
                        `}
                    >

                        <div
                            className={`
                                text-3xl
                                transition-transform
                                group-hover:scale-110
                            `}
                        >
                            {type.icon}
                        </div>

                        <span className="text-sm font-semibold text-center">
                            {type.label}
                        </span>

                    </button>

                ))}

            </div>

        </section>

    );

}
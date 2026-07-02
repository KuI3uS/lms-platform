import {
    BsLockFill,
    BsUnlockFill,
    BsCollection,
    BsSave
} from "react-icons/bs";

export default function ModuleSettings({
                                           moduleSettings,
                                           setModuleSettings,
                                           onSave
                                       }) {

    return (

        <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6 space-y-6">

            <div className="flex justify-between items-center">

                <div>

                    <h2 className="text-2xl font-bold">
                        Ustawienia modułu
                    </h2>

                    <p className="text-gray-400 mt-1">
                        Zarządzaj nazwą modułu oraz sposobem odblokowywania lekcji.
                    </p>

                </div>

                <div className="text-4xl text-blue-500">

                    {moduleSettings.lessonsLocked
                        ? <BsLockFill />
                        : <BsUnlockFill />
                    }

                </div>

            </div>

            {/* Nazwa modułu */}

            <div className="space-y-2">

                <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">

                    <BsCollection />

                    Nazwa modułu

                </label>

                <input
                    value={moduleSettings.name || ""}
                    onChange={(e) =>
                        setModuleSettings(prev => ({
                            ...prev,
                            name: e.target.value
                        }))
                    }
                    placeholder="Np. Wprowadzenie do programowania"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3"
                />

            </div>

            {/* Blokowanie lekcji */}

            <label className="flex items-center justify-between bg-gray-800 rounded-xl p-4 cursor-pointer">

                <div>

                    <div className="font-semibold">
                        Blokuj lekcje po kolei
                    </div>

                    <div className="text-sm text-gray-400 mt-1">
                        Użytkownik odblokuje następną lekcję dopiero po ukończeniu poprzedniej.
                    </div>

                </div>

                <input
                    type="checkbox"
                    checked={moduleSettings.lessonsLocked}
                    onChange={(e) =>
                        setModuleSettings(prev => ({
                            ...prev,
                            lessonsLocked: e.target.checked
                        }))
                    }
                    className="w-5 h-5"
                />

            </label>

            <button
                onClick={onSave}
                className="w-full bg-blue-600 hover:bg-blue-700 rounded-xl py-3 font-bold flex items-center justify-center gap-2 transition"
            >

                <BsSave />

                Zapisz ustawienia

            </button>

        </section>

    );

}
import { BsLockFill, BsUnlockFill } from "react-icons/bs";

export default function ModuleSettings({
                                           moduleSettings,
                                           setModuleSettings,
                                           onSave
                                       }) {
    return (
        <section className="bg-gray-900 border border-gray-800 rounded-3xl p-6">

            <div className="flex items-center justify-between gap-4">

                <div>
                    <h2 className="text-2xl font-bold">
                        Ustawienia modułu
                    </h2>

                    <p className="text-gray-400 mt-1">
                        Zdecyduj, czy lekcje mają odblokowywać się po kolei.
                    </p>
                </div>

                <div className="text-3xl text-blue-400">
                    {moduleSettings.lessonsLocked ? <BsLockFill /> : <BsUnlockFill />}
                </div>

            </div>

            <label className="mt-6 flex items-center gap-3 bg-gray-800 p-4 rounded-2xl cursor-pointer">
                <input
                    type="checkbox"
                    checked={moduleSettings.lessonsLocked}
                    onChange={e =>
                        setModuleSettings(prev => ({
                            ...prev,
                            lessonsLocked: e.target.checked
                        }))
                    }
                />

                <span className="font-semibold">
                    Blokuj lekcje po kolei
                </span>
            </label>

            <button
                onClick={onSave}
                className="mt-5 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-2xl font-bold"
            >
                Zapisz ustawienia
            </button>

        </section>
    );
}
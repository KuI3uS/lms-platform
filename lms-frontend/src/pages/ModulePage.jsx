import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";

export default function ModulePage() {

    const { courseId } = useParams();
    const navigate = useNavigate();

    const [modules, setModules] = useState([]);
    const [newModule, setNewModule] = useState("");

    const token = localStorage.getItem("token");
    let role = null;

    try {
        role = token
            ? JSON.parse(atob(token.split(".")[1])).role
            : null;
    } catch {
        role = null;
    }

    useEffect(() => {
        loadModules();
    }, [courseId]);

    const loadModules = async () => {
        try {
            const data = await apiFetch(`/modules/course/${courseId}`);
            setModules(data);
        } catch (e) {
            console.error(e);
        }
    };

    const createModule = async () => {
        if (!newModule.trim()) {
            alert("Podaj nazwę modułu");
            return;
        }

        try {
            const module = await apiFetch(`/modules/course/${courseId}`, {
                method: "POST",
                body: JSON.stringify({ name: newModule })
            });

            setModules(prev => [...prev, module]);
            setNewModule("");

        } catch (e) {
            console.error(e);
            alert("Błąd dodawania modułu");
        }
    };
    const deleteModule = async (id) => {
        if (!window.confirm("Usunąć moduł?")) return;

        try {
            await apiFetch(`/modules/${id}`, {
                method: "DELETE"
            });

            setModules(prev => prev.filter(m => m.id !== id));

        } catch (e) {
            alert("Nie można usunąć modułu");
        }
    };

    return (
        <div className="max-w-3xl mx-auto text-white space-y-6">

            <h1 className="text-3xl font-bold">Moduły</h1>

            <div className="flex gap-2">

                <input
                    value={newModule}
                    onChange={e => setNewModule(e.target.value)}
                    placeholder="Nazwa modułu"
                    className="bg-gray-700 p-2 rounded w-full"
                />

                <button
                    onClick={createModule}
                    className="bg-green-600 px-4 py-2 rounded"
                >
                    ➕
                </button>

            </div>

            {modules.map(m => (
                <div
                    key={m.id}
                    className="bg-gray-800 p-4 rounded flex justify-between items-center"
                >

                    <div
                        onClick={() => navigate(`/lessons/${m.id}`)}
                        className="cursor-pointer flex-1"
                    >
                        {m.name}
                    </div>

                    {role === "ADMIN" && (
                        <div className="flex gap-2 ml-4">

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/admin/lessons/${m.id}`);
                                }}
                                className="bg-yellow-600 px-2 py-1 rounded"
                            >
                                ⚙️
                            </button>

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteModule(m.id);
                                }}
                                className="bg-red-600 px-2 py-1 rounded"
                            >
                                🗑
                            </button>

                        </div>
                    )}

                </div>
            ))}

        </div>
    );
}
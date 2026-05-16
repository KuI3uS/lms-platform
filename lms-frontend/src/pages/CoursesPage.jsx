import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";
import {
    BsBook,
    BsPencil,
    BsTrash,
    BsCheck2,
    BsX
} from "react-icons/bs";

export default function CoursesPage() {
    const [courses, setCourses] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [newName, setNewName] = useState("");

    const navigate = useNavigate();

    const token = localStorage.getItem("token");
    const role = token ? JSON.parse(atob(token.split(".")[1])).role : null;

    const load = () => {
        apiFetch("/courses").then(setCourses);
    };

    useEffect(load, []);

    const deleteCourse = async (id) => {
        if (!window.confirm("Na pewno usunąć kurs?")) return;

        await apiFetch(`/courses/${id}`, {
            method: "DELETE"
        });

        load();
    };

    const updateCourse = async (id) => {
        if (!newName.trim()) {
            alert("Nazwa kursu nie może być pusta");
            return;
        }

        await apiFetch(`/courses/${id}`, {
            method: "PUT",
            body: JSON.stringify({ name: newName })
        });

        setEditingId(null);
        setNewName("");
        load();
    };

    const cancelEdit = () => {
        setEditingId(null);
        setNewName("");
    };

    return (
        <div className="max-w-6xl space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Kursy</h1>
                <p className="text-gray-400 mt-1">
                    Wybierz kurs, aby przejść do modułów.
                </p>
            </div>

            <div className="grid gap-4">
                {courses.map(c => (
                    <div
                        key={c.id}
                        className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex justify-between items-center hover:border-gray-700 transition"
                    >
                        {editingId === c.id ? (
                            <div className="flex items-center gap-3 w-full">
                                <input
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 flex-1 outline-none focus:border-blue-500"
                                    autoFocus
                                />

                                <button
                                    onClick={() => updateCourse(c.id)}
                                    className="bg-green-600 hover:bg-green-700 p-3 rounded-xl"
                                    title="Zapisz"
                                >
                                    <BsCheck2 />
                                </button>

                                <button
                                    onClick={cancelEdit}
                                    className="bg-gray-700 hover:bg-gray-600 p-3 rounded-xl"
                                    title="Anuluj"
                                >
                                    <BsX />
                                </button>
                            </div>
                        ) : (
                            <>
                                <div
                                    onClick={() => navigate(`/modules/${c.id}`)}
                                    className="cursor-pointer flex items-center gap-4 flex-1"
                                >
                                    <div className="w-11 h-11 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                                        <BsBook size={20} />
                                    </div>

                                    <div>
                                        <h2 className="font-semibold text-lg">
                                            {c.name}
                                        </h2>
                                        <p className="text-sm text-gray-500">
                                            Kliknij, aby zobaczyć moduły
                                        </p>
                                    </div>
                                </div>

                                {role === "ADMIN" && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingId(c.id);
                                                setNewName(c.name);
                                            }}
                                            className="bg-gray-800 hover:bg-gray-700 p-3 rounded-xl text-gray-300"
                                            title="Edytuj"
                                        >
                                            <BsPencil />
                                        </button>

                                        <button
                                            onClick={() => deleteCourse(c.id)}
                                            className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white p-3 rounded-xl"
                                            title="Usuń"
                                        >
                                            <BsTrash />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";

export default function CoursesPage() {

    const [courses, setCourses] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [newName, setNewName] = useState("");

    const token = localStorage.getItem("token");
    const role = token
        ? JSON.parse(atob(token.split(".")[1])).role
        : null;

    const load = () => {
        apiFetch("/courses").then(setCourses);
    };

    useEffect(load, []);

    const deleteCourse = async (id) => {
        await apiFetch(`/courses/${id}`, {
            method: "DELETE"
        });
        load();
    };

    const updateCourse = async (id) => {
        await apiFetch(`/courses/${id}`, {
            method: "PUT",
            body: JSON.stringify({ name: newName })
        });
        setEditingId(null);
        load();
    };

    return (
        <div className="space-y-4">

            <h1 className="text-2xl font-bold">Kursy</h1>

            {courses.map(c => (
                <div key={c.id} className="bg-gray-800 p-4 rounded flex justify-between">

                    {editingId === c.id ? (
                        <>
                            <input
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="bg-gray-700 p-2"
                            />
                            <button onClick={() => updateCourse(c.id)}>💾</button>
                        </>
                    ) : (
                        <>
                            <span>{c.name}</span>

                            {role === "ADMIN" && (
                                <div className="flex gap-2">

                                    <button
                                        onClick={() => {
                                            setEditingId(c.id);
                                            setNewName(c.name);
                                        }}
                                    >
                                        ✏️
                                    </button>

                                    <button
                                        onClick={() => deleteCourse(c.id)}
                                    >
                                        🗑
                                    </button>

                                </div>
                            )}
                        </>
                    )}

                </div>
            ))}

        </div>
    );
}
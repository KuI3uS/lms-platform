import { useEffect, useState } from "react";
import { apiFetch } from "../../api/api";

export default function AdminUsers() {

    const [users, setUsers] = useState([]);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            const data = await apiFetch("/users");
            console.log("USERS:", data);
            setUsers(data);
        } catch (e) {
            console.error("LOAD ERROR:", e);
        }
    };
    const deleteUser = async (id, email) => {
        const confirmed = window.confirm(
            `Na pewno usunąć użytkownika:\n${email}?`
        );

        if (!confirmed) return;

        try {
            await apiFetch(`/users/${id}`, { method: "DELETE" });

            setUsers(prev => prev.filter(u => u.id !== id));

        } catch (e) {
            console.error(e);
            alert("Nie udało się usunąć użytkownika");
        }
    };


    const changeRole = async (id, role) => {
        await apiFetch(`/users/${id}/role?role=${role}`, {
            method: "PUT"
        });

        setUsers(prev =>
            prev.map(u =>
                u.id === id ? { ...u, role } : u
            )
        );
    };





    return (
        <div className="text-white space-y-6">

            <h1 className="text-3xl font-bold">👥 Użytkownicy</h1>

            <div className="space-y-3">

                {users.map(u => (
                    <div key={u.id}
                         className="bg-gray-800 p-4 rounded-xl flex justify-between items-center">

                        <div>
                            <p className="font-semibold">{u.email}</p>
                            <p className="text-sm text-gray-400">{u.role}</p>
                        </div>

                        <div className="flex gap-2">

                            {/* ZMIANA ROLI */}
                            <button
                                onClick={() => changeRole(u.id, "ADMIN")}
                                className="bg-yellow-600 px-3 py-1 rounded text-sm"
                            >
                                ADMIN
                            </button>

                            <button
                                onClick={() => changeRole(u.id, "STUDENT")}
                                className="bg-blue-600 px-3 py-1 rounded text-sm"
                            >
                                STUDENT
                            </button>

                            {/* DELETE */}
                            <button
                                onClick={() => deleteUser(u.id, u.email)}
                                className="bg-red-600 px-3 py-1 rounded text-sm"
                            >
                                Usuń
                            </button>

                        </div>

                    </div>
                ))}

            </div>

        </div>
    );
}
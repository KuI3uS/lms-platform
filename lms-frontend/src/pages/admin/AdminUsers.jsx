import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../api/api";
import { useFeedback } from "../../context/FeedbackContext";

export default function AdminUsers() {
    const { confirm, showToast } = useFeedback();
    const [users, setUsers] = useState([]);

    const levels = ["1", "2", "3"];
    const groups = ["TIA", "TIB", "TIC", "TPA", "TPB", "TPC"];

    const load = useCallback(async () => {
        const data = await apiFetch("/users");
        setUsers(data || []);
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(load, 0);
        return () => window.clearTimeout(timer);
    }, [load]);

    const deleteUser = async (id, email) => {
        if (!await confirm({ title: "Usuń użytkownika", message: `Trwale usunąć konto ${email} i wszystkie jego postępy?`, confirmLabel: "Usuń konto" })) return;

        await apiFetch(`/users/${id}`, { method: "DELETE" });
        setUsers(prev => prev.filter(u => u.id !== id));
        showToast("Konto użytkownika zostało usunięte.", "success");
    };

    const changeRole = async (id, role) => {
        const updated = await apiFetch(`/users/${id}/role?role=${role}`, {
            method: "PUT"
        });

        setUsers(prev =>
            prev.map(u => u.id === id ? updated : u)
        );
    };

    const changeClass = async (id, className) => {
        if (!className) return;

        const updated = await apiFetch(`/users/${id}/class?className=${className}`, {
            method: "PUT"
        });

        setUsers(prev =>
            prev.map(u => u.id === id ? updated : u)
        );
    };

    const getLevel = (u) => {
        const name = u.schoolClass?.name || "";
        return name.charAt(0);
    };

    const getGroup = (u) => {
        const name = u.schoolClass?.name || "";
        return name.substring(1);
    };

    return (
        <div className="text-white space-y-6">

            <h1 className="text-3xl font-bold">Użytkownicy</h1>

            <div className="space-y-3">
                {users.map(u => {
                    const level = getLevel(u);
                    const group = getGroup(u);

                    return (
                        <div
                            key={u.id}
                            className="bg-gray-800 p-5 rounded-xl flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4"
                        >
                            <div>
                                <p className="font-semibold text-lg">
                                    {u.firstName || "Brak imienia"} {u.lastName || "Brak nazwiska"}
                                </p>

                                <p className="text-sm text-gray-400">
                                    {u.email}
                                </p>

                                <p className="text-sm text-gray-500">
                                    Rola: {u.role}
                                </p>

                                <p className="text-sm text-blue-400">
                                    Klasa: {u.schoolClass?.name || "Brak klasy"}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2 items-center">

                                <select
                                    value={level}
                                    onChange={(e) => changeClass(u.id, e.target.value + group)}
                                    className="bg-gray-900 p-2 rounded"
                                >
                                    <option value="">Klasa</option>
                                    {levels.map(l => (
                                        <option key={l} value={l}>
                                            {l}
                                        </option>
                                    ))}
                                </select>

                                <select
                                    value={group}
                                    onChange={(e) => changeClass(u.id, level + e.target.value)}
                                    className="bg-gray-900 p-2 rounded"
                                >
                                    <option value="">Grupa</option>
                                    {groups.map(g => (
                                        <option key={g} value={g}>
                                            {g}
                                        </option>
                                    ))}
                                </select>

                                <button
                                    onClick={() => changeRole(u.id, "ADMIN")}
                                    className="bg-yellow-600 px-3 py-2 rounded text-sm font-semibold"
                                >
                                    ADMIN
                                </button>

                                <button
                                    onClick={() => changeRole(u.id, "STUDENT")}
                                    className="bg-blue-600 px-3 py-2 rounded text-sm font-semibold"
                                >
                                    STUDENT
                                </button>

                                <button
                                    onClick={() => deleteUser(u.id, u.email)}
                                    className="bg-red-600 px-3 py-2 rounded text-sm font-semibold"
                                >
                                    Usuń
                                </button>

                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
}

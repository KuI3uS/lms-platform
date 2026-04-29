import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";

export default function UsersPage() {

    const [users, setUsers] = useState([]);

    useEffect(() => {
        apiFetch("/class/1/users").then(setUsers);
    }, []);

    return (
        <div>

            <h1 className="text-2xl font-bold mb-4">
                Użytkownicy
            </h1>

            <div className="space-y-2">

                {users.map(u => (
                    <div
                        key={u.id}
                        className="bg-gray-800 p-3 rounded"
                    >
                        {u.email}
                    </div>
                ))}

            </div>
        </div>
    );
}
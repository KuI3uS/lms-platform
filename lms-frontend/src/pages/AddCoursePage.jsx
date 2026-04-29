import { useState } from "react";
import { apiFetch } from "../api/api";

export default function AddCoursePage() {

    const [name, setName] = useState("");

    const submit = async () => {
        try {
            await apiFetch("/courses", {
                method: "POST",
                body: JSON.stringify({ name })
            });

            alert("Dodano kurs");
            setName("");

        } catch (e) {
            alert("Błąd: " + e.message);
        }
    };

    return (
        <div className="max-w-md space-y-4">

            <h1 className="text-2xl font-bold">Dodaj kurs</h1>

            <input
                className="w-full p-3 rounded bg-gray-700"
                placeholder="Nazwa kursu"
                value={name}
                onChange={(e) => setName(e.target.value)}
            />

            <button
                onClick={submit}
                className="bg-blue-600 px-4 py-2 rounded"
            >
                Dodaj
            </button>

        </div>
    );
}
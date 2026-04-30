import { useState } from "react";

export default function Register() {

    const [form, setForm] = useState({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        className: ""
    });

    const [loading, setLoading] = useState(false);

    const update = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };




    const submit = async () => {

        if (!form.email || !form.password) {
            alert("Uzupełnij dane");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch("http://localhost:8080/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...form,
                    classId: Number(form.classId)
                })
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || "Błąd rejestracji");
            }

            alert("Konto utworzone!");

            window.location.href = "/login";

        } catch (e) {
            console.error(e);
            alert("Błąd: " + e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-900 text-white">

            <div className="bg-gray-800 p-8 rounded-xl space-y-4 w-96">

                <h2 className="text-2xl font-bold">Rejestracja</h2>

                <input
                    className="w-full p-2 bg-gray-700 rounded"
                    placeholder="Email"
                    onChange={(e) => update("email", e.target.value)}
                />

                <input
                    className="w-full p-2 bg-gray-700 rounded"
                    placeholder="Hasło"
                    type="password"
                    onChange={(e) => update("password", e.target.value)}
                />

                <input
                    className="w-full p-2 bg-gray-700 rounded"
                    placeholder="Imię"
                    onChange={(e) => update("firstName", e.target.value)}
                />

                <input
                    className="w-full p-2 bg-gray-700 rounded"
                    placeholder="Nazwisko"
                    onChange={(e) => update("lastName", e.target.value)}
                />

                <input
                    className="w-full p-2 bg-gray-700 rounded"
                    placeholder="ID klasy (np. 1)"
                    onChange={(e) => update("classId", e.target.value)}
                />

                <button
                    onClick={submit}
                    disabled={loading}
                    className="w-full bg-blue-600 py-2 rounded"
                >
                    {loading ? "Tworzenie..." : "Zarejestruj"}
                </button>

            </div>

        </div>
    );
}
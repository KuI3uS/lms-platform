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

    const [level, setLevel] = useState("");
    const [group, setGroup] = useState("");

    const classes = [
        "1TIA", "1TIB", "1TIC",
        "2TIA", "2TIB", "2TIC",
        "3TIA", "3TIB", "3TIC",
        "1TPA", "1TPB", "1TPC",
        "2TPA", "2TPB", "2TPC",
        "3TPA", "3TPB", "3TPC"
    ];

    const update = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const submit = async () => {
        if (!form.email || !form.password || !level || !group) {
            alert("Uzupełnij email, hasło, klasę i grupę");
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
                    className: `${level}${group}`
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
                    className="w-full p-3 bg-gray-700 rounded"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                />

                <input
                    className="w-full p-3 bg-gray-700 rounded"
                    placeholder="Hasło"
                    type="password"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                />

                <input
                    className="w-full p-3 bg-gray-700 rounded"
                    placeholder="Imię"
                    value={form.firstName}
                    onChange={(e) => update("firstName", e.target.value)}
                />

                <input
                    className="w-full p-3 bg-gray-700 rounded"
                    placeholder="Nazwisko"
                    value={form.lastName}
                    onChange={(e) => update("lastName", e.target.value)}
                />

                <div className="grid grid-cols-2 gap-3">

                    <select
                        value={level}
                        onChange={(e) => {
                            setLevel(e.target.value);
                            setGroup("");
                        }}
                        className="w-full p-2 bg-gray-700 rounded"
                    >
                        <option value="">Wybierz klasę</option>
                        <option value="1">1 klasa</option>
                        <option value="2">2 klasa</option>
                        <option value="3">3 klasa</option>
                    </select>

                    <select
                        value={group}
                        onChange={(e) => setGroup(e.target.value)}
                        disabled={!level}
                        className="w-full p-2 bg-gray-700 rounded disabled:opacity-50"
                    >
                        <option value="">Wybierz grupę</option>
                        <option value="TIA">TIA</option>
                        <option value="TIB">TIB</option>
                        <option value="TIC">TIC</option>
                        <option value="TPA">TPA</option>
                        <option value="TPB">TPB</option>
                        <option value="TPC">TPC</option>
                    </select>

                </div>


                <button
                    onClick={submit}
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded font-semibold disabled:opacity-50"
                >
                    {loading ? "Tworzenie..." : "Zarejestruj"}
                </button>

            </div>

        </div>
    );
}
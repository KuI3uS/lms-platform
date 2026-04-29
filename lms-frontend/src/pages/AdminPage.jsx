import { Link } from "react-router-dom";

export default function AdminPage() {
    return (
        <div className="space-y-6">

            <h1 className="text-3xl font-bold">Panel Admina</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                <Link
                    to="/admin/add-course"
                    className="bg-gray-800 p-6 rounded-xl hover:bg-gray-700 transition"
                >
                    ➕ Dodaj kurs
                </Link>

                <Link
                    to="/admin/add-question"
                    className="bg-gray-800 p-6 rounded-xl hover:bg-gray-700 transition"
                >
                    ❓ Dodaj pytanie
                </Link>

                <Link
                    to="/admin/users"
                    className="bg-gray-800 p-6 rounded-xl hover:bg-gray-700 transition"
                >
                    👥 Użytkownicy
                </Link>

            </div>

        </div>
    );
}
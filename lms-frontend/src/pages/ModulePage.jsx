import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";

export default function ModulePage() {
    const { courseId } = useParams();
    const [modules, setModules] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        apiFetch(`/modules/course/${courseId}`).then(setModules);
    }, [courseId]);

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Moduły</h1>

            {modules.map(m => (
                <div
                    key={m.id}
                    className="bg-gray-800 p-4 rounded mb-2 flex justify-between items-center"
                >

                    {/* klik w moduł */}
                    <div
                        onClick={() => navigate(`/tasks/${m.id}`)}
                        className="cursor-pointer"
                    >
                        {m.name}
                    </div>

                    {/* ADMIN BUTTON */}
                    <button
                        onClick={() => navigate(`/admin/tasks/${m.id}`)}
                        className="text-sm text-red-400"
                    >
                        ⚙️ Zarządzaj
                    </button>
                </div>
            ))}
        </div>
    );
}
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api/api";

export default function ModulePage() {
    const { courseId } = useParams();
    const [modules, setModules] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        apiFetch(`/modules/course/${courseId}`).then(setModules);
    }, []);

    return (
        <div>
            <h1>Moduły</h1>

            {modules.map(m => (
                <div key={m.id}
                     onClick={() => navigate(`/test/${m.id}`)}>
                    {m.name}
                </div>
            ))}
        </div>
    );
}
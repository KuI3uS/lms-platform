import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../../api/api";

export default function useModule(moduleId) {

    const [moduleSettings, setModuleSettings] = useState({
        name: "",
        lessonsLocked: false
    });

    const [loading, setLoading] = useState(true);

    const loadModule = useCallback(async () => {

        try {

            setLoading(true);

            const data = await apiFetch(`/modules/${moduleId}`);

            setModuleSettings({
                name: data?.name || "",
                lessonsLocked: data?.lessonsLocked || false
            });

        } finally {

            setLoading(false);

        }

    }, [moduleId]);

    useEffect(() => {

        if (!moduleId) {
            return;
        }

        loadModule();

    }, [moduleId, loadModule]);

    async function saveModuleSettings() {

        await apiFetch(`/modules/${moduleId}`, {
            method: "PUT",
            body: JSON.stringify(moduleSettings)
        });

        alert("Ustawienia zapisane.");

    }

    return {

        loading,

        moduleSettings,
        setModuleSettings,

        loadModule,
        saveModuleSettings

    };

}

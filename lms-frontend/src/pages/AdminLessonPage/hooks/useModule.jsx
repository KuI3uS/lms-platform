import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../../../api/api";
import { useFeedback } from "../../../context/FeedbackContext";

export default function useModule(moduleId) {
    const { showToast } = useFeedback();

    const [moduleSettings, setModuleSettings] = useState({
        name: "",
        lessonsLocked: false,
        cefrLevel: null
    });

    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState(null);

    const loadModule = useCallback(async () => {

        try {

            setLoading(true);

            const data = await apiFetch(`/modules/${moduleId}`);

            setModuleSettings({
                name: data?.name || "",
                lessonsLocked: data?.lessonsLocked || false,
                cefrLevel: data?.cefrLevel || null
            });
            if (data?.courseId) {
                setCourse(await apiFetch(`/courses/${data.courseId}`));
            } else {
                setCourse(null);
            }

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

        showToast("Ustawienia modułu zostały zapisane.", "success");

    }

    return {

        loading,

        moduleSettings,
        setModuleSettings,
        course,
        isLanguageCourse: course?.category === "LANGUAGE",

        loadModule,
        saveModuleSettings

    };

}

import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";

export default function usePublicJavaOffer() {
    const [state, setState] = useState({ offer: null, loading: true, error: "" });
    useEffect(() => {
        const controller = new AbortController();
        apiFetch("/public/courses/java-backend-developer", { skipAuthRedirect: true, signal: controller.signal })
            .then(offer => { if (!controller.signal.aborted) setState({ offer, loading: false, error: "" }); })
            .catch(() => {
                if (!controller.signal.aborted) setState({ offer: null, loading: false, error: "Nie udało się pobrać aktualnej oferty. Odśwież stronę lub sprawdź ponownie później." });
            });
        return () => controller.abort();
    }, []);
    return state;
}

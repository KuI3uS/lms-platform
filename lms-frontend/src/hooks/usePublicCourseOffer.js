import { useEffect, useState } from "react";
import { apiFetch } from "../api/api";
import { useLocale } from "../context/LocaleContext";
import { courseCatalogPath, courseMatchesLanguage } from "../utils/courseContentLanguage";

export default function usePublicCourseOffer(slug) {
    const { language } = useLocale();
    const [state, setState] = useState({ language, slug, offer: null, loading: true, error: "", unavailable: false });
    useEffect(() => {
        const controller = new AbortController();
        apiFetch(courseCatalogPath(`/public/courses/${slug}`, language), { skipAuthRedirect: true, signal: controller.signal })
            .then(offer => {
                if (controller.signal.aborted) return;
                const matches = courseMatchesLanguage(offer, language);
                setState({ language, slug, offer: matches ? offer : null, loading: false, unavailable: !matches,
                    error: matches ? "" : "Ten kurs nie ma jeszcze wersji w wybranym języku." });
            })
            .catch(error => {
                if (!controller.signal.aborted) setState({ language, slug, offer: null, loading: false, unavailable: error.status === 404,
                    error: "Nie udało się pobrać aktualnej oferty. Odśwież stronę lub sprawdź ponownie później." });
            });
        return () => controller.abort();
    }, [language, slug]);
    return state.language === language && state.slug === slug ? state : { offer: null, loading: true, error: "", unavailable: false };
}

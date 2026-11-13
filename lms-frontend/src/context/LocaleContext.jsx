/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { createBrowserPreference, normalizeUiLanguage, resolveUiLanguage, SUPPORTED_LANGUAGES, translateUi } from "../utils/localization.js";

const languageStore = createBrowserPreference("eduhub.ui-language", "pl", stored => resolveUiLanguage({
    stored,
    search: window.location.search,
    browserLanguages: window.navigator.languages || [window.navigator.language]
}));
const fallback = {
    language: "pl", locale: "pl", dateLocale: "pl-PL", setLanguage: () => {},
    t: (source, params) => translateUi(source, "pl", params),
    formatNumber: (value, options) => new Intl.NumberFormat("pl-PL", options).format(value)
};
const LocaleContext = createContext(fallback);

export function LocaleProvider({ children }) {
    const language = useSyncExternalStore(languageStore.subscribe, languageStore.getSnapshot, languageStore.getServerSnapshot);
    const dateLocale = SUPPORTED_LANGUAGES.find(option => option.value === language)?.locale || "pl-PL";
    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);
    const value = useMemo(() => ({
        language, locale: language, dateLocale,
        t: (source, params) => translateUi(source, language, params),
        formatNumber: (number, options) => new Intl.NumberFormat(dateLocale, options).format(number),
        setLanguage(next) {
            const selected = normalizeUiLanguage(next);
            if (!selected) return;
            languageStore.set(selected);
            // Do not let an old explicit ?lang= value undo a user's new selection on reload.
            const url = new URL(window.location.href);
            if (url.searchParams.has("lang")) {
                url.searchParams.set("lang", selected);
                window.history.replaceState(window.history.state, "", url);
            }
        }
    }), [language, dateLocale]);
    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext);

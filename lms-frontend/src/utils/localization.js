import coreMessages from "../i18n/coreMessages.js";
import publicMessages from "../i18n/publicMessages.js";
import studentMessages from "../i18n/studentMessages.js";
import workspaceMessages from "../i18n/workspaceMessages.js";
import extraMessages1 from "../i18n/extraMessages1.js";
import extraMessages2 from "../i18n/extraMessages2.js";
import extraMessages3 from "../i18n/extraMessages3.js";
import extraMessages4 from "../i18n/extraMessages4.js";
import runnerMessages from "../i18n/runnerMessages.js";

export const SUPPORTED_LANGUAGES = Object.freeze([
    { value: "pl", label: "Polski", short: "PL", locale: "pl-PL" },
    { value: "en", label: "English", short: "EN", locale: "en-GB" },
    { value: "es", label: "Español", short: "ES", locale: "es-ES" }
]);
export const UI_MESSAGES = { ...extraMessages1, ...extraMessages2, ...extraMessages3, ...extraMessages4, ...publicMessages, ...studentMessages, ...workspaceMessages, ...coreMessages, ...runnerMessages };

export function normalizeUiLanguage(value) {
    const code = String(value || "").toLowerCase().split(/[-_]/)[0];
    return SUPPORTED_LANGUAGES.some(language => language.value === code) ? code : "";
}

export function resolveUiLanguage({ search = "", stored = "", browserLanguages = [] } = {}) {
    return normalizeUiLanguage(new URLSearchParams(search).get("lang"))
        || normalizeUiLanguage(stored)
        || browserLanguages.map(normalizeUiLanguage).find(Boolean)
        || "pl";
}

export function translateUi(source, language = "pl", params = {}) {
    if (typeof source !== "string") return source;
    const trimmed = source.trim();
    const translated = UI_MESSAGES[source]?.[language] || UI_MESSAGES[trimmed]?.[language];
    const text = language === "pl" || !translated ? source
        : source === trimmed ? translated : source.replace(trimmed, translated);
    return text.replace(/\{([a-zA-Z][\w]*)\}/g, (match, key) => (
        Object.hasOwn(params, key) ? String(params[key]) : match
    ));
}

/** A small external store keeps pre-rendered HTML Polish until hydration finishes. */
export function createBrowserPreference(key, fallback, initialValue = () => fallback) {
    let memory;
    const listeners = new Set();
    const emit = () => listeners.forEach(listener => listener());
    return {
        getSnapshot() {
            if (typeof window === "undefined") return fallback;
            if (memory === undefined) {
                let stored = "";
                try { stored = window.localStorage.getItem(key) || ""; } catch { /* Private browsing still works. */ }
                memory = initialValue(stored);
            }
            return memory;
        },
        getServerSnapshot: () => fallback,
        set(value) {
            memory = value;
            try { window.localStorage.setItem(key, value); } catch { /* Keep the in-memory choice. */ }
            emit();
        },
        subscribe(listener) {
            listeners.add(listener);
            const storage = event => {
                if (event.key !== key && event.key !== null) return;
                memory = undefined;
                emit();
            };
            if (typeof window !== "undefined") window.addEventListener("storage", storage);
            return () => {
                listeners.delete(listener);
                if (typeof window !== "undefined") window.removeEventListener("storage", storage);
            };
        }
    };
}

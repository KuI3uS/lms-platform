import { normalizeUiLanguage } from "./localization.js";

export const CONTENT_LANGUAGES = Object.freeze([
    { value: "pl", label: "Polski" },
    { value: "en", label: "Angielski" },
    { value: "es", label: "Hiszpański" }
]);

// Old courses predate this field and contain Polish-authored materials.
export const contentLanguageOf = course => normalizeUiLanguage(course?.contentLanguage) || "pl";
export const contentLanguageLabel = language => CONTENT_LANGUAGES.find(item => item.value === language)?.label || "Polski";
export const courseMatchesLanguage = (course, language) => contentLanguageOf(course) === (normalizeUiLanguage(language) || "pl");

export function courseCatalogPath(path, language, { allLanguages = false } = {}) {
    const [pathname, search = ""] = path.split("?");
    const params = new URLSearchParams(search);
    params.set("lang", normalizeUiLanguage(language) || "pl");
    if (allLanguages) params.set("allLanguages", "true");
    else params.delete("allLanguages");
    return `${pathname}?${params}`;
}

export const courseLocaleCacheOwner = (owner, language) => `${owner}:${normalizeUiLanguage(language) || "pl"}`;

const DEFAULT_API_URL = "https://lms-platform-1-dcxg.onrender.com/api";

function resolveApiUrl(value) {
    const configuredUrl = value?.trim().replace(/\/+$/, "");

    // Ten adres był przykładowym placeholderem i nie wskazuje na backend EduHub.
    if (!configuredUrl || configuredUrl.includes("twoj-backend.onrender.com")) {
        return DEFAULT_API_URL;
    }

    return configuredUrl.endsWith("/api")
        ? configuredUrl
        : `${configuredUrl}/api`;
}

export const API_URL = resolveApiUrl(import.meta.env.VITE_API_URL);

export function getToken() {
    return localStorage.getItem("token");
}

export function logout() {
    localStorage.removeItem("token");
    window.location.href = "/";
}

export async function apiFetch(url, options = {}) {
    const token = getToken();

    const res = await fetch(API_URL + url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: "Bearer " + token } : {}),
            ...(options.headers || {})
        }
    });

    const text = await res.text();

    if (!res.ok) {
        let message = text || "Request failed";
        try {
            const errorBody = JSON.parse(text);
            message = errorBody.message || errorBody.error || message;
        } catch {
            // Odpowiedź błędu nie musi być JSON-em.
        }
        throw new Error(message);
    }

    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("JSON PARSE ERROR:", text);
        throw e;
    }
}

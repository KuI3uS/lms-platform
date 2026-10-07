export const API_URL = import.meta.env.VITE_API_URL
    || "https://lms-platform-1-dcxg.onrender.com/api";

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

    if (res.status === 401 || res.status === 403) {
        throw new Error("Unauthorized");
    }

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

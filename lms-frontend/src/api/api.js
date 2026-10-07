const API_URL = "http://localhost:8080/api";

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

    console.log("API RESPONSE:", text);

    if (!res.ok) {
        throw new Error(text || "Request failed");
    }

    if (!text) return null;

    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("JSON PARSE ERROR:", text);
        throw e;
    }
}
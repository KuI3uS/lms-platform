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

let redirectingToLogin = false;

function redirectAfterUnauthorized() {
    localStorage.removeItem("token");

    if (redirectingToLogin || window.location.pathname === "/login") {
        return;
    }

    redirectingToLogin = true;
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    sessionStorage.setItem("eduhub:return-after-login", returnTo);
    window.location.replace("/login?session=expired");
}

export async function apiFetch(url, options = {}) {
    const token = getToken();
    const {
        skipAuthRedirect = false,
        ...fetchOptions
    } = options;

    const res = await fetch(API_URL + url, {
        ...fetchOptions,
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

        if (
            res.status === 401
            && token
            && !skipAuthRedirect
            && !url.startsWith("/auth/")
        ) {
            message = "Sesja wygasła. Zaloguj się ponownie.";
            redirectAfterUnauthorized();
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

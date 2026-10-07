const CSRF_STORAGE_KEY = "eduhub:csrf";

// Żądania pozostają pod domeną frontendu, a hosting przekazuje /api do backendu.
// Dzięki temu ciasteczko sesyjne nie staje się ciasteczkiem zewnętrznym.
export const API_URL = "/api";

export function setCsrfToken(token) {
    if (token) sessionStorage.setItem(CSRF_STORAGE_KEY, token);
    else sessionStorage.removeItem(CSRF_STORAGE_KEY);
}

export function getCsrfToken() {
    return sessionStorage.getItem(CSRF_STORAGE_KEY) || "";
}

export function clearClientSession() {
    localStorage.removeItem("token");
    setCsrfToken("");
    Object.keys(sessionStorage)
        .filter((key) => key.startsWith("eduhub-"))
        .forEach((key) => sessionStorage.removeItem(key));
}

let redirectingToLogin = false;

function redirectAfterUnauthorized() {
    clearClientSession();

    if (redirectingToLogin || window.location.pathname === "/login") return;

    redirectingToLogin = true;
    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    sessionStorage.setItem("eduhub:return-after-login", returnTo);
    window.location.replace("/login?session=expired");
}

function isUnsafeMethod(method) {
    return !["GET", "HEAD", "OPTIONS"].includes((method || "GET").toUpperCase());
}

export async function apiFetch(url, options = {}) {
    const {
        skipAuthRedirect = false,
        ...fetchOptions
    } = options;
    const csrfToken = getCsrfToken();

    const res = await fetch(API_URL + url, {
        ...fetchOptions,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...(isUnsafeMethod(fetchOptions.method) && csrfToken
                ? { "X-EDUHUB-CSRF": csrfToken }
                : {}),
            ...(options.headers || {})
        }
    });

    const text = await res.text();

    if (!res.ok) {
        let message = text || "Nie udało się wykonać operacji.";
        try {
            const errorBody = JSON.parse(text);
            message = errorBody.message || errorBody.error || message;
        } catch {
            // Odpowiedź błędu nie musi być JSON-em.
        }

        if (
            res.status === 401
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
    } catch (error) {
        console.error("JSON PARSE ERROR:", text);
        throw error;
    }
}

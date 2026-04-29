export function getToken() {
    return localStorage.getItem("token");
}

export function getPayload() {
    try {
        const token = getToken();
        if (!token) return null;

        const base64 = token.split(".")[1];
        if (!base64) return null;

        return JSON.parse(atob(base64));
    } catch (e) {
        console.error("TOKEN ERROR:", e);
        return null;
    }
}

export function getRole() {
    const payload = getPayload();
    return payload?.role || null;
}
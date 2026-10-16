const STORAGE_KEY = "eduhub:course-purchase-intent";
const validId = value => /^[1-9]\d{0,17}$/.test(String(value ?? ""));

export function purchaseCourseId(search) {
    const id = new URLSearchParams(search).get("course");
    return validId(id) ? id : null;
}

export function rememberCoursePurchase(id, storage) {
    if (!validId(id)) return;
    try {
        (storage ?? globalThis.localStorage)?.setItem(STORAGE_KEY, JSON.stringify({ id: String(id), expiresAt: Date.now() + 3_600_000 }));
    } catch { /* The course query parameter still works without storage. */ }
}

export function rememberedCoursePurchase(storage) {
    try {
        const saved = JSON.parse((storage ?? globalThis.localStorage)?.getItem(STORAGE_KEY) || "null");
        return saved && validId(saved.id) && Number(saved.expiresAt) > Date.now() ? String(saved.id) : null;
    } catch { return null; }
}

export function clearCoursePurchase(storage) {
    try { (storage ?? globalThis.localStorage)?.removeItem(STORAGE_KEY); } catch { /* Optional storage. */ }
}

export function safeLoginDestination(search, storedDestination, storage) {
    const explicitCourse = purchaseCourseId(search);
    if (explicitCourse) return `/checkout/${explicitCourse}`;
    if (typeof storedDestination === "string" && storedDestination.startsWith("/")
        && !storedDestination.startsWith("//") && !/[\\\r\n]/.test(storedDestination)) return storedDestination;
    const remembered = rememberedCoursePurchase(storage);
    return remembered ? `/checkout/${remembered}` : "/courses";
}

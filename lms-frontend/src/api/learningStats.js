import { apiFetch } from "./api";

const CACHE_TTL = 15_000;

let cachedStats = null;
let cachedAt = 0;
let pendingRequest = null;

export function invalidateLearningStats() {
    cachedStats = null;
    cachedAt = 0;
}

export function fetchLearningStats({ force = false } = {}) {
    const cacheIsFresh = cachedStats
        && Date.now() - cachedAt < CACHE_TTL;

    if (!force && cacheIsFresh) {
        return Promise.resolve(cachedStats);
    }

    if (!force && pendingRequest) {
        return pendingRequest;
    }

    pendingRequest = apiFetch("/learning-stats")
        .then((stats) => {
            cachedStats = stats;
            cachedAt = Date.now();
            return stats;
        })
        .finally(() => {
            pendingRequest = null;
        });

    return pendingRequest;
}

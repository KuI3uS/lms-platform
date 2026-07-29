import { apiFetch, getToken } from "./api";

const CACHE_TTL = 15_000;

let cachedToken = null;
let cachedStats = null;
let cachedAt = 0;
let pendingRequest = null;

export function invalidateLearningStats() {
    cachedStats = null;
    cachedAt = 0;
}

export function fetchLearningStats({ force = false } = {}) {
    const token = getToken();
    const sameUser = token === cachedToken;
    const cacheIsFresh = sameUser
        && cachedStats
        && Date.now() - cachedAt < CACHE_TTL;

    if (!force && cacheIsFresh) {
        return Promise.resolve(cachedStats);
    }

    if (!force && sameUser && pendingRequest) {
        return pendingRequest;
    }

    cachedToken = token;
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

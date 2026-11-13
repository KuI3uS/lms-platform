export const SITE_MUSIC = Object.freeze({
    pl: { src: "/music/eduhub-pl.mp3", title: "EduHub", version: "Wersja polska" },
    en: { src: "/music/eduhub-en.mp3", title: "Mañana de mañana araña", version: "Wersja angielska" },
    es: { src: "/music/eduhub-es.mp3", title: "EduHub", version: "Wersja hiszpańska" }
});

export function musicTrackForLanguage(language) {
    return SITE_MUSIC[language] || SITE_MUSIC.pl;
}

export function shouldPauseSiteMusic(pathname) {
    return /^\/(?:lesson|test|exams)\/[^/]+/.test(pathname)
        || /^\/language-reviews(?:\/|$)/.test(pathname);
}

export function musicVolume(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(1, Math.max(0, number)) : 0.2;
}

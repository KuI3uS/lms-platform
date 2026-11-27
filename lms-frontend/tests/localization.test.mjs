import assert from "node:assert/strict";
import test from "node:test";
import { normalizeUiLanguage, resolveUiLanguage, SUPPORTED_LANGUAGES, translateUi, UI_MESSAGES } from "../src/utils/localization.js";
import { musicTrackForLanguage, musicVolume, shouldPauseSiteMusic } from "../src/utils/siteMusic.js";
import { statSync, readFileSync } from "node:fs";

test("PL EN ES are the only UI languages and explicit selection wins over browser preferences", () => {
    assert.deepEqual(SUPPORTED_LANGUAGES.map(language => language.value), ["pl", "en", "es"]);
    assert.equal(normalizeUiLanguage("ES-es"), "es");
    assert.equal(normalizeUiLanguage("en_GB"), "en");
    assert.equal(normalizeUiLanguage("fr"), "");
    assert.equal(resolveUiLanguage({ search: "?lang=es", stored: "en", browserLanguages: ["pl-PL"] }), "es");
    assert.equal(resolveUiLanguage({ stored: "en", browserLanguages: ["es"] }), "en");
    assert.equal(resolveUiLanguage({ browserLanguages: ["fr", "es-MX"] }), "es");
    assert.equal(resolveUiLanguage(), "pl");
});

test("translation changes UI copy only, keeps unknown content and preserves interpolation", () => {
    assert.equal(translateUi("Włącz muzykę", "en"), "Play music");
    assert.equal(translateUi("Włącz muzykę", "es"), "Activar música");
    assert.equal(translateUi("Odznaka ligi {name}", "en", { name: "Copper" }), "Copper league badge");
    assert.equal(translateUi("  Włącz muzykę ", "es"), "  Activar música ");
    for (const source of ["Mój własny kurs", "TicketCard", "SELECT * FROM uczniowie;", '<?php echo "$imie";', "Good morning!"]) {
        assert.equal(translateUi(source, "es"), source);
    }
    for (const [source, translations] of Object.entries(UI_MESSAGES)) {
        assert.ok(translations.en?.trim(), `${source}: missing EN`);
        assert.ok(translations.es?.trim(), `${source}: missing ES`);
        const placeholders = text => [...text.matchAll(/\{([a-zA-Z][\w]*)\}/g)].map(match => match[1]).sort();
        for (const language of ["en", "es"]) assert.deepEqual(placeholders(translations[language]), placeholders(source), `${source}: ${language}`);
    }
});

test("each language selects its own real audio asset and Mañana is mapped to English", () => {
    assert.equal(musicTrackForLanguage("en").src, "/music/eduhub-en.mp3");
    assert.match(musicTrackForLanguage("en").title, /Mañana/);
    assert.equal(musicTrackForLanguage("pl").src, "/music/eduhub-pl.mp3");
    assert.equal(musicTrackForLanguage("es").src, "/music/eduhub-es.mp3");
    for (const language of ["pl", "en", "es"]) {
        assert.ok(statSync(new URL(`../public${musicTrackForLanguage(language).src}`, import.meta.url)).size > 100_000);
    }
    assert.equal(musicVolume("0.25"), 0.25);
    assert.equal(musicVolume(3), 1);
    assert.equal(musicVolume(-2), 0);
    assert.equal(musicVolume("invalid"), 0.2);
});

test("music belongs ONLY to the public homepage, not login, offers, courses or any app page", () => {
    for (const path of ["/lesson/2", "/test/12", "/exams/2", "/language-reviews", "/courses", "/exams", "/admin/lessons/2", "/login", "/register", "/dashboard", "/kurs/java-backend-developer", "/kurs/python-ai-automatyzacje-dla-biznesu", "/egzaminy/inf-03", "/support"]) {
        assert.equal(shouldPauseSiteMusic(path), true, path);
    }
    assert.equal(shouldPauseSiteMusic("/"), false);
    const music = readFileSync(new URL("../src/context/MusicContext.jsx", import.meta.url), "utf8");
    assert.match(music, /preload="none"/);
    assert.match(music, /NotAllowedError/);
    assert.match(music, /visibilitychange/);
    assert.match(music, /audio\.removeAttribute\("src"\)/);
    const controls = readFileSync(new URL("../src/components/LocaleControls.jsx", import.meta.url), "utf8");
    assert.match(controls, /!music\.suspended && <>/);
    assert.doesNotMatch(music, /getUserMedia|SpeechRecognition|expectedAnswer/);
});

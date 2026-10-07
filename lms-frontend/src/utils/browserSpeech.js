import { speechText } from "./pronunciation.js";

export function createLessonUtterance(text, language, synthesis, Utterance) {
    const locale = language || "en-GB";
    const utterance = new Utterance(speechText(text, locale));
    utterance.lang = locale;
    const voices = synthesis.getVoices();
    utterance.voice = voices.find((voice) => voice.lang.toLowerCase() === locale.toLowerCase())
        || voices.find((voice) => voice.lang.split("-")[0].toLowerCase() === locale.split("-")[0].toLowerCase())
        || null;
    utterance.rate = 0.88;
    return utterance;
}

export function speakWithBrowser(text, language) {
    if (!text || typeof window === "undefined" || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return false;
    const synthesis = window.speechSynthesis;
    synthesis.cancel();
    synthesis.speak(createLessonUtterance(text, language, synthesis, window.SpeechSynthesisUtterance));
    return true;
}

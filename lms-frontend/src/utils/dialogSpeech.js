const FEMALE_NAMES = /\b(samantha|serena|karen|moira|tessa|victoria|susan|zira|hazel|aria|jenny|sonia|libby|female)\b/i;
const MALE_NAMES = /\b(daniel|alex|david|mark|george|guy|ryan|james|male)\b/i;
const languageKey = (value) => String(value || "en-GB").toLowerCase().replaceAll("_", "-");

export function characterVoiceGender(character) {
    if (["female", "male", "neutral"].includes(character?.voiceGender)) return character.voiceGender;
    // Names and emoji are only defaults for legacy fictional characters.
    if (String(character?.avatar || "").includes("👩") || /^(mia|mija|emma|sophie|olivia)$/i.test(character?.name || "")) return "female";
    if (String(character?.avatar || "").includes("👨") || /^(alex|leo|daniel|adam)$/i.test(character?.name || "")) return "male";
    return "neutral";
}

export function languageVoices(voices, language) {
    const base = languageKey(language).split("-")[0];
    return voices.filter((voice) => languageKey(voice.lang).split("-")[0] === base);
}

// Web Speech does not expose a gender field. Prefer known voice names, but
// always allow a manual choice from the voices installed on the student's device.
export function selectDialogVoice(voices, language, character, preferredURI) {
    const candidates = languageVoices(voices, language);
    const chosen = candidates.find((voice) => voice.voiceURI === preferredURI);
    if (chosen) return chosen;
    const gender = characterVoiceGender(character);
    const preferred = gender === "female" ? FEMALE_NAMES : gender === "male" ? MALE_NAMES : null;
    return candidates.map((voice, index) => ({
        voice, index,
        score: (preferred?.test(voice.name) ? 100 : 0)
            + (languageKey(voice.lang) === languageKey(language) ? 20 : 0)
            + (voice.default ? 1 : 0)
    })).sort((a, b) => b.score - a.score || a.index - b.index)[0]?.voice || null;
}

export function createDialogPlayer({ synthesis, Utterance, onState, startTimeout = 4000 }) {
    let generation = 0;
    let timer;
    let current;
    const stop = (notify = true) => {
        generation += 1;
        clearTimeout(timer);
        if (current) {
            current.onstart = current.onend = current.onerror = null;
            current = null;
            synthesis?.cancel();
        }
        if (notify) onState({ status: "idle", index: -1 });
    };
    const play = (turns, characters, language, overrides = {}, singleIndex = null) => {
        stop(false);
        if (!synthesis || !Utterance) {
            onState({ status: "unsupported", index: -1 });
            return;
        }
        const run = generation;
        const fail = (status, index) => {
            if (run !== generation) return;
            stop(false);
            onState({ status, index });
        };
        const next = (index) => {
            if (run !== generation) return;
            if (index >= turns.length) {
                current = null;
                onState({ status: "done", index: -1 });
                return;
            }
            const turn = turns[index];
            const character = characters.find((item) => item.id === turn.speakerId) || characters[0];
            const voice = selectDialogVoice(synthesis.getVoices(), language, character, overrides[character?.id]);
            if (!voice) { fail("no-voice", index); return; }
            const utterance = new Utterance(turn.text);
            current = utterance; // Keep a reference until the utterance finishes.
            utterance.voice = voice;
            utterance.lang = voice.lang;
            utterance.rate = 0.88;
            onState({ status: "starting", index });
            timer = setTimeout(() => fail("blocked", index), startTimeout);
            utterance.onstart = () => {
                if (run !== generation) return;
                clearTimeout(timer);
                onState({ status: "playing", index });
            };
            utterance.onerror = (event) => fail(event.error === "not-allowed" ? "blocked" : "error", index);
            utterance.onend = () => {
                if (run !== generation) return;
                clearTimeout(timer);
                current = null;
                if (singleIndex !== null) onState({ status: "done", index: -1 });
                else next(index + 1);
            };
            try { synthesis.speak(utterance); } catch { fail("error", index); }
        };
        // Stop other lesson audio before starting this conversation.
        synthesis.cancel();
        next(singleIndex ?? 0);
    };
    return { play, stop };
}

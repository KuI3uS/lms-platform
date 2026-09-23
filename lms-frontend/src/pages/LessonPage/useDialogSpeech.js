import { useEffect, useMemo, useRef, useState } from "react";
import { createDialogPlayer, languageVoices } from "../../utils/dialogSpeech";

const preferenceKey = (language, name) => `eduhub-dialog-voice:${language || "en-GB"}:${name}`;

export default function useDialogSpeech(config, language) {
    const [playback, setPlayback] = useState({ status: "idle", index: -1 });
    const [voices, setVoices] = useState([]);
    const [overrides, setOverrides] = useState(() => Object.fromEntries(config.characters.map((character) => {
        let saved = "";
        try { saved = localStorage.getItem(preferenceKey(language, character.name)) || ""; } catch { /* Private mode. */ }
        return [character.id, saved];
    })));
    const overridesRef = useRef(overrides);
    const attempted = useRef(false);
    const player = useMemo(() => createDialogPlayer({
        synthesis: typeof window !== "undefined" ? window.speechSynthesis : null,
        Utterance: typeof window !== "undefined" ? window.SpeechSynthesisUtterance : null,
        onState: setPlayback
    }), []);

    useEffect(() => {
        const synthesis = window.speechSynthesis;
        const tryAutoplay = () => {
            if (attempted.current || document.hidden || !config.turns.length) return;
            attempted.current = true;
            player.play(config.turns, config.characters, language, overridesRef.current);
        };
        const loadVoices = () => {
            const available = synthesis?.getVoices() || [];
            setVoices(languageVoices(available, language));
            if (available.length) tryAutoplay();
        };
        const onVisibility = () => {
            if (document.hidden) {
                attempted.current = true;
                player.stop();
            }
        };
        // Defer until mounted; voices can also arrive asynchronously.
        const initial = setTimeout(loadVoices, 200);
        const fallback = setTimeout(tryAutoplay, 1800);
        synthesis?.addEventListener("voiceschanged", loadVoices);
        document.addEventListener("visibilitychange", onVisibility);
        return () => {
            clearTimeout(initial);
            clearTimeout(fallback);
            synthesis?.removeEventListener("voiceschanged", loadVoices);
            document.removeEventListener("visibilitychange", onVisibility);
            player.stop(false);
        };
    }, [config, language, player]);

    const stop = () => {
        attempted.current = true;
        player.stop();
    };
    const play = (index = null) => {
        attempted.current = true;
        player.play(config.turns, config.characters, language, overrides, index);
    };
    const chooseVoice = (character, uri) => {
        stop();
        const next = { ...overrides, [character.id]: uri };
        overridesRef.current = next;
        setOverrides(next);
        try { localStorage.setItem(preferenceKey(language, character.name), uri); } catch { /* Playback still works. */ }
    };
    return { playback, voices, overrides, play, stop, chooseVoice };
}

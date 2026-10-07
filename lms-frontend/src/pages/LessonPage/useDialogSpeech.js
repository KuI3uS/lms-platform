import { useEffect, useMemo, useRef, useState } from "react";
import { createDialogPlayer } from "../../utils/dialogSpeech";

export default function useDialogSpeech(config, language) {
    const [playback, setPlayback] = useState({ status: "idle", index: -1 });
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
            player.play(config.turns, config.characters, language);
        };
        const loadVoices = () => {
            const available = synthesis?.getVoices() || [];
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
        player.play(config.turns, config.characters, language, index);
    };
    return { playback, play, stop };
}

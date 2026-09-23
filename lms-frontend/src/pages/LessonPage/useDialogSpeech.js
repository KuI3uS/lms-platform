import { useEffect, useMemo, useRef, useState } from "react";
import { createDialogPlayer } from "../../utils/dialogSpeech";

// Przerwa pomiędzy kolejnymi wypowiedziami dialogu.
// Zmień np. na 100 (szybciej) albo 600 (wolniej).
const DIALOG_TURN_GAP_MS = 250;

export default function useDialogSpeech(config, language, blockId) {
    const [playback, setPlayback] = useState({ status: "idle", index: -1, source: "natural" });
    const attempted = useRef(false);
    const generation = useRef(0);
    const audioRef = useRef(null);
    const objectUrlRef = useRef("");
    const fallback = useMemo(() => createDialogPlayer({
        synthesis: typeof window !== "undefined" ? window.speechSynthesis : null,
        Utterance: typeof window !== "undefined" ? window.SpeechSynthesisUtterance : null,
        onState: (state) => setPlayback({ ...state, source: "browser" })
    }), []);

    const releaseAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.onplay = null;
            audioRef.current.onended = null;
            audioRef.current.onerror = null;
            audioRef.current = null;
        }
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = "";
        }
    };

    const stopPlayback = (notify = true) => {
        generation.current += 1;
        releaseAudio();
        fallback.stop(false);
        if (notify) setPlayback({ status: "idle", index: -1, source: "natural" });
    };

    const loadNaturalTurn = async (index) => {
        const response = await fetch(`/api/lesson-blocks/${blockId}/dialog-audio/${index}`, {
            credentials: "include",
            headers: { Accept: "audio/mpeg" }
        });
        if (!response.ok) throw new Error(`natural-audio-${response.status}`);
        return response.blob();
    };

    const playNaturalTurn = async (index, run, blob) => {
        if (run !== generation.current) return;
        objectUrlRef.current = URL.createObjectURL(blob);
        const audio = new Audio(objectUrlRef.current);
        audioRef.current = audio;

        await new Promise((resolve, reject) => {
            audio.onplay = () => {
                if (run === generation.current) {
                    setPlayback({ status: "playing", index, source: "natural" });
                }
            };
            audio.onended = resolve;
            audio.onerror = reject;
            audio.play().catch(reject);
        });
        if (run === generation.current) releaseAudio();
    };

    const play = async (singleIndex = null) => {
        attempted.current = true;
        stopPlayback(false);
        if (!blockId) {
            fallback.play(config.turns, config.characters, language, singleIndex);
            return;
        }
        const run = generation.current;
        const indexes = singleIndex === null
            ? config.turns.map((_, index) => index)
            : [singleIndex];
        let played = 0;
        try {
            setPlayback({ status: "starting", index: indexes[0] ?? -1, source: "natural" });

            // Pobieramy wszystkie wypowiedzi przed rozpoczęciem rozmowy. Dzięki temu
            // opóźnienie sieci lub generowanie nagrania nie tworzy kilkusekundowych
            // przerw pomiędzy postaciami.
            const blobs = await Promise.all(indexes.map(loadNaturalTurn));

            for (let position = 0; position < indexes.length; position += 1) {
                const index = indexes[position];
                if (run !== generation.current) return;
                await playNaturalTurn(index, run, blobs[position]);
                played += 1;
                if (position < indexes.length - 1 && DIALOG_TURN_GAP_MS > 0) {
                    await new Promise((resolve) => setTimeout(resolve, DIALOG_TURN_GAP_MS));
                }
            }
            if (run === generation.current) {
                setPlayback({ status: "done", index: -1, source: "natural" });
            }
        } catch {
            if (run !== generation.current) return;
            releaseAudio();
            // Brak konfiguracji ElevenLabs nie blokuje istniejących lekcji.
            if (played === 0) {
                fallback.play(config.turns, config.characters, language, singleIndex);
            } else {
                setPlayback({ status: "error", index: indexes[played] ?? -1, source: "natural" });
            }
        }
    };

    useEffect(() => {
        const tryAutoplay = () => {
            if (attempted.current || document.hidden || !config.turns.length || !blockId) return;
            attempted.current = true;
            play();
        };
        const onVisibility = () => {
            if (document.hidden) {
                attempted.current = true;
                stopPlayback();
            }
        };
        const initial = setTimeout(tryAutoplay, 300);
        document.addEventListener("visibilitychange", onVisibility);
        return () => {
            clearTimeout(initial);
            document.removeEventListener("visibilitychange", onVisibility);
            stopPlayback(false);
        };
        // Odtwarzacz jest tworzony dla konkretnego bloku dialogu.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [blockId, config, language, fallback]);

    const stop = () => {
        attempted.current = true;
        stopPlayback();
    };
    return { playback, play, stop };
}

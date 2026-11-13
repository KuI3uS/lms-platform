/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocation } from "react-router-dom";
import { useLocale } from "./LocaleContext.jsx";
import { createBrowserPreference } from "../utils/localization.js";
import { musicTrackForLanguage, musicVolume, shouldPauseSiteMusic } from "../utils/siteMusic.js";

const enabledStore = createBrowserPreference("eduhub.music-enabled", "off", value => value === "on" ? "on" : "off");
const volumeStore = createBrowserPreference("eduhub.music-volume", "0.2", value => value ? String(musicVolume(value)) : "0.2");
const MusicContext = createContext({ enabled: false, status: "paused", volume: 0.2, suspended: false, toggle: () => {}, setVolume: () => {}, track: musicTrackForLanguage("pl") });

export function MusicProvider({ children }) {
    const { language } = useLocale();
    const { pathname } = useLocation();
    const audioRef = useRef(null);
    const generation = useRef(0);
    const [status, setStatus] = useState("paused");
    const enabled = useSyncExternalStore(enabledStore.subscribe, enabledStore.getSnapshot, enabledStore.getServerSnapshot) === "on";
    const volume = Number(useSyncExternalStore(volumeStore.subscribe, volumeStore.getSnapshot, volumeStore.getServerSnapshot));
    const volumeRef = useRef(volume);
    const suspended = shouldPauseSiteMusic(pathname);
    const track = musicTrackForLanguage(language);

    const play = useCallback(() => {
        const audio = audioRef.current;
        if (!audio || suspended || document.hidden) return;
        const run = ++generation.current;
        if (audio.getAttribute("src") !== track.src) audio.src = track.src;
        audio.volume = volumeRef.current;
        setStatus("loading");
        const attempt = audio.play();
        attempt?.catch(error => {
            if (run !== generation.current || error.name === "AbortError") return;
            setStatus(error.name === "NotAllowedError" ? "blocked" : "error");
        });
    }, [suspended, track.src]);

    useEffect(() => {
        volumeRef.current = volume;
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    useEffect(() => {
        const audio = audioRef.current;
        const synchronize = () => {
            if (enabled && !suspended && !document.hidden) play();
            else { generation.current += 1; audio?.pause(); }
        };
        synchronize();
        document.addEventListener("visibilitychange", synchronize);
        return () => {
            document.removeEventListener("visibilitychange", synchronize);
        };
    }, [enabled, suspended, play]);

    useEffect(() => {
        const audio = audioRef.current;
        return () => { generation.current += 1; audio?.pause(); };
    }, []);

    return <MusicContext.Provider value={{
        enabled, status, volume, suspended, track,
        toggle() {
            if (suspended) return;
            if (enabled && status !== "blocked" && status !== "error") {
                enabledStore.set("off");
                generation.current += 1;
                audioRef.current?.pause();
            } else {
                enabledStore.set("on");
                // Keep play() in the click gesture, including Safari's user activation.
                play();
            }
        },
        setVolume(value) { volumeStore.set(String(musicVolume(value))); }
    }}>
        {children}
        <audio ref={audioRef} preload="none" loop aria-hidden="true"
            onPlaying={() => setStatus("playing")}
            onPause={() => setStatus("paused")}
            onError={() => setStatus("error")} />
    </MusicContext.Provider>;
}

export const useSiteMusic = () => useContext(MusicContext);

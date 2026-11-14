import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BsGlobe2, BsMusicNoteBeamed, BsPauseFill, BsPlayFill, BsSliders2, BsX } from "react-icons/bs";
import { useLocale } from "../context/LocaleContext.jsx";
import { useSiteMusic } from "../context/MusicContext.jsx";
import { SUPPORTED_LANGUAGES } from "../utils/localization.js";
import "../styles/locale-controls.css";

export default function LocaleControls({ compact = false }) {
    const { language, setLanguage, t } = useLocale();
    const music = useSiteMusic();
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState({ left: 16, top: 70 });
    const rootRef = useRef(null);
    const panelRef = useRef(null);
    const triggerRef = useRef(null);
    const panelId = useId();
    useEffect(() => {
        if (!open) return;
        const close = event => {
            if (event.key === "Escape") { setOpen(false); triggerRef.current?.focus(); }
            else if (event.type === "pointerdown" && !rootRef.current?.contains(event.target) && !panelRef.current?.contains(event.target)) setOpen(false);
        };
        document.addEventListener("keydown", close);
        document.addEventListener("pointerdown", close);
        const onResize = () => setOpen(false);
        window.addEventListener("resize", onResize);
        return () => {
            document.removeEventListener("keydown", close);
            document.removeEventListener("pointerdown", close);
            window.removeEventListener("resize", onResize);
        };
    }, [open]);
    const musicLabel = ["blocked", "error"].includes(music.status) ? t("Odtwórz muzykę po kliknięciu")
            : music.enabled ? t("Wyłącz muzykę") : t("Włącz muzykę");
    return <div ref={rootRef} className={`locale-controls ${compact ? "locale-controls--compact" : ""}`}>
        <label className="locale-language">
            <BsGlobe2 aria-hidden="true" />
            <span className="sr-only">{t("Język strony")}</span>
            <select aria-label={t("Język strony")} value={language} onChange={event => setLanguage(event.target.value)}>
                {SUPPORTED_LANGUAGES.map(option => <option key={option.value} value={option.value} lang={option.value}>{compact ? option.short : option.label}</option>)}
            </select>
        </label>
        {!music.suspended && <>
        <button type="button" className="locale-music-toggle" onClick={music.toggle}
            aria-label={musicLabel} title={musicLabel} aria-pressed={music.enabled}>
            {music.status === "playing" ? <BsPauseFill aria-hidden="true" /> : <BsMusicNoteBeamed aria-hidden="true" />}
        </button>
        <button type="button" ref={triggerRef} className="locale-settings" aria-label={t("Ustawienia muzyki")}
            aria-expanded={open} aria-controls={panelId} onClick={event => {
                const rect = event.currentTarget.getBoundingClientRect();
                const width = Math.min(310, window.innerWidth - 32);
                setPosition({ left: Math.max(16, Math.min(rect.right - width, window.innerWidth - width - 16)), top: Math.max(16, Math.min(rect.bottom + 10, window.innerHeight - 330)) });
                setOpen(value => !value);
            }}><BsSliders2 aria-hidden="true" /></button>
        {open && createPortal(<div ref={panelRef} className="locale-controls"><section id={panelId} className="locale-music-panel" style={{ position: "fixed", ...position }} aria-label={t("Ustawienia muzyki")}>
            <div className="locale-panel-heading"><strong>{t("Muzyka")}</strong><button type="button" onClick={() => { setOpen(false); triggerRef.current?.focus(); }} aria-label={t("Zamknij ustawienia muzyki")}><BsX aria-hidden="true" /></button></div>
            <p className="locale-track-title">{music.track.title} · {t(music.track.version)}</p>
            <p>{t("Muzyka jest opcjonalna. Utwór dopasowujemy do języka strony.")}</p>
            {music.status === "error" && <p role="status">{t("Nie udało się wczytać utworu. Spróbuj ponownie.")}</p>}
            <label className="locale-volume"><span>{t("Głośność muzyki")} · {Math.round(music.volume * 100)}%</span><input aria-label={t("Głośność muzyki")} type="range" min="0" max="1" step="0.05" value={music.volume} onChange={event => music.setVolume(event.target.value)} /></label>
            <button type="button" className="locale-play-button" onClick={music.toggle} disabled={music.suspended}>{music.status === "playing" ? <BsPauseFill aria-hidden="true" /> : <BsPlayFill aria-hidden="true" />}{musicLabel}</button>
        </section></div>, document.body)}
        </>}
    </div>;
}

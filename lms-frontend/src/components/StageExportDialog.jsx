import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BsClipboard, BsDownload, BsX } from "react-icons/bs";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../context/LocaleContext";
import { useFeedback } from "../context/FeedbackContext";
import { apiFetch } from "../api/api";
import { CONTENT_LANGUAGES } from "../utils/courseContentLanguage";
import { formatStageExport, stageExportFilename } from "../utils/stageLessonExport";
import "../styles/stage-export.css";

export default function StageExportDialog({ moduleId, moduleTitle, onClose }) {
    const { user } = useAuth();
    const { t } = useLocale();
    const { showToast } = useFeedback();
    const isAdmin = user?.role === "ADMIN";
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reload, setReload] = useState(0);
    const [target, setTarget] = useState("en");
    const dialogRef = useRef(null);
    const closeRef = useRef(onClose);
    const titleId = useId();
    const helpId = useId();
    useEffect(() => { closeRef.current = onClose; }, [onClose]);

    useEffect(() => {
        if (!isAdmin) return undefined;
        const controller = new AbortController();
        setLoading(true);
        setError("");
        setData(null);
        apiFetch(`/admin/modules/${moduleId}/export`, { signal: controller.signal })
            .then(stage => {
                if (controller.signal.aborted) return;
                setTarget(stage.contentLanguage === "en" ? "es" : "en");
                setData(stage);
            })
            .catch(requestError => {
                if (!controller.signal.aborted) setError(requestError.status === 403
                    ? "Eksport etapu jest dostępny tylko dla administratora."
                    : "Nie udało się pobrać całego etapu. Żaden plik nie został utworzony.");
            })
            .finally(() => { if (!controller.signal.aborted) setLoading(false); });
        return () => controller.abort();
    }, [isAdmin, moduleId, reload]);

    useEffect(() => {
        if (!isAdmin) return undefined;
        const previous = document.activeElement;
        const app = document.getElementById("root");
        const wasInert = app?.inert;
        if (app) app.inert = true;
        const focusable = () => [...(dialogRef.current?.querySelectorAll("button:not([disabled]), select:not([disabled]), textarea") || [])];
        focusable()[0]?.focus();
        const handleKey = event => {
            if (event.key === "Escape") { event.preventDefault(); closeRef.current(); }
            if (event.key !== "Tab") return;
            const elements = focusable();
            const first = elements[0], last = elements.at(-1);
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        };
        document.addEventListener("keydown", handleKey);
        return () => {
            document.removeEventListener("keydown", handleKey);
            if (app) app.inert = wasInert;
            previous?.focus?.();
        };
    }, [isAdmin, moduleId]);

    const targetLanguage = target === "original" ? data?.contentLanguage || "pl" : target;
    const formatted = useMemo(() => {
        if (!data) return { text: "", error: "" };
        try { return { text: formatStageExport(data, { targetLanguage }), error: "" }; }
        catch (formatError) { return { text: "", error: formatError.message }; }
    }, [data, targetLanguage]);
    const blockCount = data?.lessons?.reduce((sum, lesson) => sum + (lesson.blocks?.length || 0), 0) || 0;
    const legacy = data?.lessons?.some(lesson => lesson.theory || lesson.example || lesson.content || lesson.imageUrl);
    const emptyCount = data?.lessons?.filter(lesson => !lesson.blocks?.length).length || 0;
    const ready = !loading && !error && !formatted.error && Boolean(formatted.text);

    const copy = async () => {
        if (!ready) return;
        try {
            await navigator.clipboard.writeText(formatted.text);
            showToast("Skopiowano cały etap wraz z instrukcją dla ChatGPT.", "success");
        } catch {
            showToast("Nie udało się skopiować tekstu. Pobierz plik .txt.", "warning");
        }
    };
    const download = () => {
        if (!ready) return;
        const url = URL.createObjectURL(new Blob(["\uFEFF", formatted.text], { type: "text/plain;charset=utf-8" }));
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = stageExportFilename(data, targetLanguage);
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    };

    if (!isAdmin) return null;
    return createPortal(<div className="stage-export-overlay" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
        <section ref={dialogRef} className="stage-export-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={helpId}>
            <header><div><p>{t("Tylko administrator")}</p><h2 id={titleId}>{t("Cały etap dla ChatGPT")}</h2><span>{data?.stageTitle || moduleTitle}</span></div><button type="button" className="stage-export-close" onClick={onClose} aria-label={t("Zamknij eksport etapu")}><BsX aria-hidden="true" /></button></header>
            <div className="stage-export-body">
                <p id={helpId}>{t("Wybierz język, pobierz plik i załącz go w ChatGPT. Instrukcja poprosi o tłumaczenie oraz osobny blok tekstu dla każdej lekcji, z polami jedno pod drugim.")}</p>
                <div className="stage-export-warning">{t("Plik zawiera również rozwiązania i ukryte testy. Nie udostępniaj go uczniom. Eksport nie zmienia ani nie publikuje kursu.")}</div>
                {loading && <p role="status">{t("Pobieranie wszystkich lekcji i bloków etapu…")}</p>}
                {(error || formatted.error) && <div role="alert" className="stage-export-error"><p>{t(error || formatted.error)}</p>{error && <button type="button" onClick={() => setReload(value => value + 1)}>{t("Spróbuj ponownie")}</button>}</div>}
                {data && <div className="stage-export-options">
                    <label>{t("Przygotuj plik")}<select value={target} disabled={!ready} onChange={event => setTarget(event.target.value)}>
                        <option value="original">{t("Oryginał bez tłumaczenia")}</option>
                        {CONTENT_LANGUAGES.filter(item => item.value !== data.contentLanguage).map(item => <option key={item.value} value={item.value}>{t("Tłumaczenie: {language}", { language: t(item.label) })}</option>)}
                    </select></label>
                    <p role="status">{t("Lekcje: {lessons} · Bloki: {blocks}", { lessons: data.lessons?.length || 0, blocks: blockCount })}</p>
                </div>}
                {emptyCount > 0 && <p className="stage-export-note">{t("Lekcje bez bloków: {count}. Zostają w eksporcie; nie dopisujemy im treści.", { count: emptyCount })}</p>}
                {legacy && <p className="stage-export-note">{t("Eksport zawiera także starsze pola lekcji. Import bloków nie przenosi ich automatycznie — zachowaj je przy tworzeniu wersji językowej.")}</p>}
                {ready && <><label className="stage-export-preview-label" htmlFor={helpId + "-preview"}>{t("Podgląd pliku — układ pionowy")}</label><textarea id={helpId + "-preview"} readOnly value={formatted.text} spellCheck={false} /></>}
                <details className="stage-export-how"><summary>{t("Jak wykorzystać tłumaczenie?")}</summary><p>{t("W docelowej wersji językowej kursu utwórz etap i karty lekcji z przetłumaczonymi tytułami. Następnie wczytaj odpowiedź ChatGPT przez import bloków etapu. Import dopasowuje istniejące karty po tytule, niczego nie tworzy i nie nadpisuje polskiego kursu. Sprawdź tłumaczenie przed publikacją.")}</p></details>
            </div>
            <footer><button type="button" onClick={copy} disabled={!ready}><BsClipboard aria-hidden="true" />{t("Kopiuj tekst")}</button><button type="button" onClick={download} disabled={!ready} className="stage-export-primary"><BsDownload aria-hidden="true" />{t("Pobierz plik .txt")}</button></footer>
        </section>
    </div>, document.body);
}

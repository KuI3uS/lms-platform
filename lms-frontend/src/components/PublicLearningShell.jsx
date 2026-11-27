import { Link } from "react-router-dom";
import LocaleControls from "./LocaleControls";
import { useLocale } from "../context/LocaleContext";
import "../styles/public-learning.css";

export default function PublicLearningShell({ children }) {
    const { t } = useLocale();
    return <div className="public-learning">
        <a className="pl-skip" href="#public-content">{t("Przejdź do treści")}</a>
        <header className="pl-header"><div className="pl-container pl-nav">
            <Link reloadDocument to="/" className="pl-brand" aria-label={t("EduHub — strona główna")}>edu<strong>hub</strong><span>.</span></Link>
            <nav aria-label={t("Główna nawigacja")}><Link reloadDocument to="/#sciezki">{t("Kursy")}</Link><Link reloadDocument to="/pomoc">{t("Pomoc i kontakt")}</Link><Link reloadDocument to="/login">{t("Zaloguj się")}</Link></nav>
            <LocaleControls compact />
        </div></header>
        <main id="public-content">{children}</main>
        <footer className="pl-container pl-footer"><p>EduHub · Jakub Marcinkowski</p><nav aria-label={t("Nauka")}><Link reloadDocument to="/#sciezki">{t("Kursy")}</Link><Link reloadDocument to="/pomoc">{t("Pomoc i kontakt")}</Link></nav></footer>
    </div>;
}

export function PolishLearningNotice() {
    const { t, setLanguage } = useLocale();
    return <section className="pl-container pl-section">
        <h1>{t("Te materiały są przygotowane po polsku.")}</h1>
        <p className="pl-lead">{t("Zmiana języka interfejsu nie tłumaczy treści kursu. Wybierz polską wersję tej strony albo sprawdź katalog w swoim języku.")}</p>
        <div className="pl-actions"><button type="button" className="pl-button" onClick={() => setLanguage("pl")}>{t("Czytaj po polsku")}</button><Link reloadDocument className="pl-link" to="/courses">{t("Przejdź do katalogu")}</Link></div>
    </section>;
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { BsCheckCircleFill, BsList, BsX } from "react-icons/bs";
import { useLocale } from "../context/LocaleContext";
import LocaleControls from "./LocaleControls";
import usePublicJavaOffer from "../hooks/usePublicJavaOffer";
import { formatOfferPrice, getPublicOfferPlans, JAVA_COURSE_PATH } from "../utils/javaCourseOffer";
import { HOME_FAQ, PRACTICE_EXAMPLES, checkPracticeAnswer, getPracticeExample, getHomeLearningPaths } from "../utils/homeContent";
import "../styles/landing.css";

function Brand({ footer = false }) {
    const { t } = useLocale();
    return <a className="eh-brand" href={footer ? "#start" : "/"} aria-label={t("EduHub — strona główna")}>
        edu<strong>hub</strong><span aria-hidden="true">.</span>
    </a>;
}

function CodeExample({ code }) {
    const { t } = useLocale();
    const tokens = /("[^"\n]*"|'[^'\n]*'|\b(?:String|SELECT|FROM|WHERE|System|out|println)\b|\b\d+\b)/g;
    return <div className="eh-code-grid">
        <div className="eh-line-numbers" aria-hidden="true">{code.split("\n").map((_, index) => <span key={index}>{index + 1}</span>)}</div>
        <pre aria-label={t("Przykład kodu")}><code>{code.split(tokens).map((part, index) => (
            <span key={index} className={/^["']/.test(part) ? "eh-token-string" : /^(String|SELECT|FROM|WHERE)$/.test(part) ? "eh-token-keyword" : undefined}>{part}</span>
        ))}</code></pre>
    </div>;
}

function PracticeStudio() {
    const { t, language } = useLocale();
    const [active, setActive] = useState("java");
    const [answer, setAnswer] = useState("");
    const [result, setResult] = useState(null);
    const example = getPracticeExample(active, language);
    const changeExample = id => { setActive(id); setAnswer(""); setResult(null); };
    return <section id="wyprobuj" className="eh-studio" aria-labelledby="eh-studio-title" tabIndex={-1}>
        <div className="eh-studio-heading"><span>{t("Próbka lekcji")}</span><span>{t("Bez logowania")}</span></div>
        <div className="eh-studio-tabs" role="tablist" aria-label={t("Wybierz przykładowe zadanie")}>
            {PRACTICE_EXAMPLES.map((item, index) => <button key={item.id} id={`eh-tab-${item.id}`} type="button" role="tab"
                aria-selected={active === item.id} aria-controls="eh-practice-panel" tabIndex={active === item.id ? 0 : -1}
                onClick={() => changeExample(item.id)} onKeyDown={event => {
                    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                    event.preventDefault();
                    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? PRACTICE_EXAMPLES.length - 1
                        : (index + (event.key === "ArrowRight" ? 1 : -1) + PRACTICE_EXAMPLES.length) % PRACTICE_EXAMPLES.length;
                    const next = PRACTICE_EXAMPLES[nextIndex].id;
                    changeExample(next);
                    event.currentTarget.parentElement.querySelector(`#eh-tab-${next}`)?.focus();
                }}>{t(item.label)}</button>)}
        </div>
        <div id="eh-practice-panel" role="tabpanel" aria-labelledby={`eh-tab-${active}`}>
            <div className="eh-code-heading"><span>{example.file}</span><span>{t("Przeczytaj kod")}</span></div>
            <CodeExample code={example.code} />
            <div className="eh-challenge">
                <h2 id="eh-studio-title">{t(example.question)}</h2>
                <form onSubmit={event => { event.preventDefault(); setResult(checkPracticeAnswer(active, answer, language)); }}>
                    <label className="eh-sr-only" htmlFor="eh-demo-answer">{t("Twoja odpowiedź")}</label>
                    <div className="eh-answer-row"><input id="eh-demo-answer" autoComplete="off" spellCheck={false} value={answer} placeholder={t(example.placeholder)}
                        onChange={event => { setAnswer(event.target.value); setResult(null); }} /><button className="eh-button eh-button-primary" type="submit">{t("Sprawdź")}</button></div>
                </form>
                <div className={`eh-feedback${result === "correct" ? " is-correct" : result ? " is-retry" : ""}`} role="status" aria-live="polite">
                    {result === "correct" ? <><BsCheckCircleFill aria-hidden="true" /><span>{t(example.explanation)}</span></>
                        : result === "retry" ? t(example.hint) : result === "empty" ? t("Wpisz odpowiedź, a potem sprawdź rozwiązanie.")
                            : t("Sprawdź sposób nauki. Bez konta i bez zapisywania wyniku.")}
                </div>
            </div>
        </div>
    </section>;
}

function CoursePrice({ offerState }) {
    const { t, language, dateLocale } = useLocale();
    const { offer, loading, error } = offerState;
    const plans = getPublicOfferPlans(offer);
    return <aside className="eh-course-price" aria-label={t("Aktualny dostęp do kursu Java")}>
        <p className="eh-kicker">{t("Cena i dostęp")}</p>
        <div className="eh-price-list" aria-live="polite">
            {loading ? <p className="eh-muted" role="status">{t("Pobieranie aktualnej oferty…")}</p>
                : error || !plans.length ? <p className="eh-muted">{t("Aktualne warunki dostępu sprawdzisz na stronie kursu.")}</p>
                    : plans.map(plan => <div className="eh-price-row" key={plan.id}>
                        <div><span>{t(plan.title)}</span><strong>{formatOfferPrice(plan.price, dateLocale)}{plan.id === "SUBSCRIPTION" && <small>{t("/ mies.")}</small>}</strong></div>
                        <p>{t(plan.renewal)}</p>
                    </div>)}
        </div>
        <Link reloadDocument to={`${JAVA_COURSE_PATH}?lang=${language}`} className="eh-button eh-button-primary">{t("Zobacz program kursu")}</Link>
        <p className="eh-price-note">{t("Materiały są udostępniane etapami. Założenie konta nie uruchamia płatności.")}</p>
    </aside>;
}

export default function LandingPage() {
    const { t, language } = useLocale();
    const offerState = usePublicJavaOffer();
    const [menuOpen, setMenuOpen] = useState(false);
    const [pathFilter, setPathFilter] = useState("all");
    const paths = getHomeLearningPaths(language, offerState.offer, language === "pl" ? pathFilter : "all");
    const allPaths = getHomeLearningPaths(language, offerState.offer);
    const javaPath = paths.find(path => path.id === "java");
    const examPaths = paths.filter(path => path.category === "exams");
    const closeMenu = () => setMenuOpen(false);
    return <div className="eh-home" id="start">
        <a className="eh-skip-link" href="#eh-main">{t("Przejdź do treści")}</a>
        <header className="eh-header" onKeyDown={event => {
            if (event.key === "Escape" && menuOpen) { closeMenu(); event.currentTarget.querySelector(".eh-menu-toggle")?.focus(); }
        }}>
            <div className="eh-container eh-nav-inner"><Brand />
                <nav id="eh-navigation" className={`eh-navigation${menuOpen ? " is-open" : ""}`} aria-label={t("Główna nawigacja")}>
                    <a href="#sciezki" onClick={closeMenu}>{t("Kursy")}</a><a href="#metoda" onClick={closeMenu}>{t("Jak uczymy")}</a>
                    <a href="#korepetycje" onClick={closeMenu}>{t("Korepetycje")}</a><a href="#faq" onClick={closeMenu}>{t("Pytania i odpowiedzi")}</a>
                    <Link reloadDocument to="/login" className="eh-mobile-account" onClick={closeMenu}>{t("Zaloguj się")}</Link>
                    <Link reloadDocument to="/register" className="eh-mobile-account" onClick={closeMenu}>{t("Załóż konto")}</Link>
                </nav>
                <div className="eh-nav-actions"><Link reloadDocument to="/login" className="eh-login-link">{t("Zaloguj się")}</Link><Link reloadDocument to="/register" className="eh-register-link">{t("Załóż konto")}</Link><LocaleControls compact />
                    <button type="button" className="eh-menu-toggle" aria-expanded={menuOpen} aria-controls="eh-navigation" aria-label={menuOpen ? t("Zamknij menu") : t("Otwórz menu")} onClick={() => setMenuOpen(value => !value)}>
                        {menuOpen ? <BsX aria-hidden="true" /> : <BsList aria-hidden="true" />}
                    </button>
                </div>
            </div>
        </header>
        <main id="eh-main">
            <section className="eh-hero eh-container" aria-labelledby="eh-hero-title">
                <div className="eh-hero-copy"><p className="eh-kicker">{t("Programowanie od podstaw")}</p>
                    <h1 id="eh-hero-title">{t("Zrozum kod.")}<br /><em>{t("Napisz własny.")}</em></h1>
                    <p className="eh-hero-lead">{t("Java, SQL i zadania, przy których trzeba pomyśleć. Krótkie wyjaśnienie, własne rozwiązanie i wskazówki do poprawy. Uczysz się, robiąc — we własnym tempie.")}</p>
                    <div className="eh-hero-actions"><a href="#sciezki" className="eh-button eh-button-primary">{t("Zobacz kursy")}</a><a className="eh-text-link" href="#wyprobuj">{t("Spróbuj bez konta")}</a></div>
                    <div className="eh-author-byline"><span className="eh-byline-mark" aria-hidden="true">JM</span><p>{t("Autorska platforma Jakuba Marcinkowskiego.")}<br /><a href="#autor">{t("Poznaj twórcę")}</a></p></div>
                </div>
                <PracticeStudio key={language} />
            </section>
            <section id="metoda" className="eh-method eh-container" aria-labelledby="eh-method-title">
                <div><p className="eh-kicker">{t("Tak wygląda lekcja")}</p><h2 id="eh-method-title">{t("Teoria to dopiero początek.")}</h2></div>
                <ol className="eh-method-list">
                    <li><h3>{t("Poznaj temat")}</h3><p>{t("Przeczytaj krótkie wyjaśnienie. Zobacz na przykładzie, jak działa kod.")}</p></li>
                    <li><h3>{t("Napisz rozwiązanie")}</h3><p>{t("Rozwiąż zadanie samodzielnie. Nie musisz od razu znać dobrej odpowiedzi.")}</p></li>
                    <li><h3>{t("Sprawdź i popraw")}</h3><p>{t("W zadaniach sprawdzanych automatycznie dostajesz wynik i wskazówki. Popraw kod i spróbuj ponownie.")}</p></li>
                </ol>
            </section>
            <section id="sciezki" className="eh-catalog" aria-labelledby="eh-catalog-title"><div className="eh-container">
                <div className="eh-section-heading"><div><p className="eh-kicker">{t("Czego chcesz się nauczyć?")}</p><h2 id="eh-catalog-title">{t("Kursy i ścieżki nauki")}</h2></div>
                    <p>{t("Sprawdź program przed założeniem konta. Dostępne lekcje i swój postęp znajdziesz później na platformie.")}</p>
                </div>
                {allPaths.some(path => path.category === "exams") && <div className="eh-path-filters" role="group" aria-label={t("Filtruj ścieżki nauki")}>
                    {[["all", "Wszystkie ścieżki"], ["programming", "Programowanie"], ["exams", "Egzaminy zawodowe"]].map(([id, label]) => <button key={id} type="button" aria-pressed={pathFilter === id} onClick={() => setPathFilter(id)}>{t(label)}</button>)}
                </div>}
                <div aria-live="polite" className="eh-course-list">
                    {javaPath && <article className="eh-java-course" id="kurs-java">
                        <div className="eh-course-copy"><p className="eh-kicker">{t("Programowanie")}</p><h3 aria-label="Java Backend Developer">Java Backend<br />Developer</h3>
                            <p>{t("Od przygotowania środowiska i pierwszego programu po kolejne zagadnienia Javy. Uporządkowany plan dla tych, którzy chcą rozumieć swój kod, a nie tylko go przepisywać.")}</p>
                            <ul className="eh-course-topics"><li>{t("JDK i IntelliJ IDEA")}</li><li>{t("Zmienne i typy danych")}</li><li>{t("Git i GitHub")}</li><li>{t("Ćwiczenia z kodem")}</li></ul>
                        </div><CoursePrice offerState={offerState} />
                    </article>}
                    {examPaths.map(path => <article className="eh-exam-row" key={path.id}>
                        <div><p className="eh-kicker">{t("Egzamin zawodowy")}</p><h3>{path.title}</h3></div>
                        <div><p>{t(path.description)}</p><ul>{path.tags.map(tag => <li key={tag}>{t(tag)}</li>)}</ul></div>
                        <Link reloadDocument to={path.href} className="eh-text-link">{t("Zobacz na platformie")}</Link>
                    </article>)}
                    {!allPaths.length && <div className="eh-catalog-empty"><h3>{t(offerState.loading ? "Pobieranie aktualnej oferty…" : offerState.unavailable ? "Kursy w Twoim języku" : "Aktualna oferta jest chwilowo niedostępna.")}</h3>
                        {!offerState.loading && <p>{t(offerState.unavailable ? "Dostępne kursy w wybranym języku sprawdzisz w katalogu na platformie. Każda wersja językowa ma osobno przygotowane materiały." : offerState.error)}</p>}
                        <Link reloadDocument to="/courses" className="eh-text-link">{t("Przejdź do katalogu")}</Link>
                    </div>}
                </div>
                <p className="eh-catalog-note">{t("Warunki dostępu do konkretnego kursu sprawdzisz przed zakupem. Samo założenie konta nie uruchamia płatności.")}</p>
            </div></section>
            <section id="korepetycje" className="eh-tutoring eh-container" aria-labelledby="eh-tutoring-title">
                <div><p className="eh-kicker">{t("Indywidualne spotkania online")}</p><h2 id="eh-tutoring-title">{t("Utknąłeś przy zadaniu?")}</h2>
                    <p>{t("Przyjdź ze swoim kodem, komunikatem błędu albo pytaniem z lekcji. Na korepetycjach możemy skupić się na tym, czego akurat nie rozumiesz.")}</p>
                    <Link reloadDocument to="/tutoring-booking" className="eh-button eh-button-primary">{t("Sprawdź dostępne terminy")}</Link>
                    <p className="eh-muted eh-tutoring-note">{t("Temat i termin wybierzesz na stronie rezerwacji.")}</p>
                </div>
                <aside className="eh-tutoring-note-sheet"><span>1:1</span><h3>{t("Jedno spotkanie. Twój temat.")}</h3><p>{t("Java, SQL, zadania szkolne i przygotowanie do egzaminów INF.")}</p>
                    <ul><li>{t("Wybierz termin w kalendarzu.")}</li><li>{t("Napisz, nad czym pracujesz.")}</li><li>{t("Przygotuj kod lub treść zadania.")}</li></ul>
                </aside>
            </section>
            <section id="faq" className="eh-faq-section" aria-labelledby="eh-faq-title"><div className="eh-container eh-faq-layout">
                <div><p className="eh-kicker">{t("Zanim zaczniesz")}</p><h2 id="eh-faq-title">{t("Dobrze wiedzieć.")}</h2><p className="eh-muted">{t("O koncie, kursach i sposobie nauki. Bez drobnego druku.")}</p><Link reloadDocument to="/pomoc" className="eh-text-link">{t("Pomoc i kontakt")}</Link></div>
                <div className="eh-faq-list">{HOME_FAQ.map(item => <details key={item.question}><summary>{t(item.question)}<span className="eh-faq-sign" aria-hidden="true" /></summary><p>{t(item.answer)}</p></details>)}</div>
            </div></section>
            <section id="autor" className="eh-creator eh-container" aria-labelledby="eh-creator-title">
                <div><p className="eh-kicker">{t("Za EduHub stoi człowiek.")}</p><h2 id="eh-creator-title">Jakub Marcinkowski</h2></div>
                <div><p>{t("EduHub to autorski projekt Jakuba Marcinkowskiego: platforma, materiały i miejsce do ćwiczenia programowania. Wyjaśnienia łączą się tu z zadaniami, żeby nauka nie kończyła się na przeczytaniu tekstu.")}</p><a href="https://kui3us.github.io/portfolio/" target="_blank" rel="noopener noreferrer" className="eh-text-link">{t("Poznaj twórcę")}</a></div>
            </section>
        </main>
        <footer className="eh-footer"><div className="eh-container">
            <div className="eh-footer-top"><div className="eh-footer-brand"><Brand footer /><p>{t("Miejsce na Twój następny pomysł.")}</p></div>
                <nav aria-label={t("Nauka")}><h2>{t("Nauka")}</h2><a href="#sciezki">{t("Kursy")}</a><a href="#wyprobuj">{t("Wypróbuj zadanie")}</a><Link reloadDocument to="/tutoring-booking">{t("Korepetycje online")}</Link></nav>
                <nav aria-label="EduHub"><h2>EduHub</h2><Link reloadDocument to="/login">{t("Zaloguj się")}</Link><Link reloadDocument to="/register">{t("Załóż konto")}</Link><Link reloadDocument to="/pomoc">{t("Pomoc i kontakt")}</Link></nav>
                <nav aria-label={t("Poznaj twórcę")}><h2>{t("Poznaj twórcę")}</h2><a href="https://github.com/KuI3uS" target="_blank" rel="noopener noreferrer">GitHub</a><a href="https://linkedin.com/in/jakubmarcinkowski" target="_blank" rel="noopener noreferrer">LinkedIn</a><a href="https://kui3us.github.io/portfolio/" target="_blank" rel="noopener noreferrer">{t("Portfolio")}</a></nav>
            </div><div className="eh-footer-bottom"><span>© {new Date().getFullYear()} EduHub · Jakub Marcinkowski</span><a href="#start">{t("Wróć na górę")}</a></div>
        </div></footer>
    </div>;
}

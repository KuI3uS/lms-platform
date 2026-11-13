import { useLocale } from "../context/LocaleContext";
import LocaleControls from "../components/LocaleControls";
import { useState } from "react";
import { Link } from "react-router-dom";
import { BsArrowRight, BsCheck2, BsCodeSlash, BsMortarboard, BsTerminal } from "react-icons/bs";
import { useAuth } from "../context/AuthContext";
import usePublicJavaOffer from "../hooks/usePublicJavaOffer";
import { formatOfferPrice, getCourseDescription, getPublicOfferPlans, JAVA_COURSE_DESCRIPTION } from "../utils/javaCourseOffer";
import { rememberCoursePurchase } from "../utils/coursePurchaseIntent";
import { JAVA_COURSE_TOPICS } from "../utils/javaCourseSeo";
import "../styles/java-course-offer.css";

function PracticePreview() {
    const { t } = useLocale();
    const [answer, setAnswer] = useState("");
    const [result, setResult] = useState(null);
    return (
        <section className="java-practice" aria-labelledby="practice-title">
            <div className="java-terminal-bar"><span><i /><i /><i /></span><span>Main.java</span><BsTerminal aria-hidden="true" /></div>
            <div className="java-practice-inner">
                <p className="java-kicker">{t("Spróbuj przed założeniem konta")}</p>
                <h2 id="practice-title">{t("Jaki wynik wypisze program?")}</h2>
                <p>{t("Trzy ukończone lekcje. Po 20 punktów za każdą.")}</p>
                <pre><code><span className="java-code-muted">// Oblicz zdobyte punkty</span>{"\n"}<span className="java-code-keyword">int</span>{" lessons = 3;\n"}<span className="java-code-keyword">int</span>{" xpPerLesson = 20;\n\n"}<span className="java-code-call">System.out.println</span>{"(\n    lessons * xpPerLesson\n);"}</code></pre>
                <form onSubmit={event => {
                    event.preventDefault();
                    setResult(!answer.trim() ? "empty" : answer.trim() === "60" ? "correct" : "retry");
                }}>
                    <label htmlFor="java-demo-answer">{t("Wpisz wynik programu")}</label>
                    <div className="java-demo-controls"><input id="java-demo-answer" inputMode="numeric" autoComplete="off" placeholder={t("Twoja odpowiedź")} value={answer} onChange={event => { setAnswer(event.target.value); setResult(null); }} /><button type="submit">{t("Sprawdź")}{" "}<BsArrowRight aria-hidden="true" /></button></div>
                </form>
                <p className={`java-demo-result ${result === "correct" ? "is-correct" : ""}`} role="status" aria-live="polite">
                    {result === "correct" ? t("Dobrze! 3 × 20 = 60. Rozumiesz wynik, a nie tylko przepisujesz kod.")
                        : result === "retry" ? t("Spróbuj jeszcze raz. Pomnóż liczbę lekcji przez punkty za jedną lekcję.")
                            : result === "empty" ? t("Najpierw wpisz swoją odpowiedź.") : t("Przykładowe ćwiczenie na tej stronie. Wynik nie jest zapisywany w kursie.")}
                </p>
            </div>
        </section>
    );
}

export default function JavaCourseOfferPage() {
    const { t, dateLocale, formatNumber } = useLocale();
    const { user } = useAuth();
    const { offer, loading, error } = usePublicJavaOffer();
    const plans = getPublicOfferPlans(offer);
    const courseDescription = getCourseDescription(offer || { title: "Java Backend Developer" });
    const destination = offer ? user ? `/checkout/${offer.id}` : `/register?course=${offer.id}` : "/register";
    const checkoutLink = (label, className = "java-primary-link") => (
        <Link reloadDocument className={className} to={destination} onClick={() => offer && rememberCoursePurchase(offer.id)}>{label}<BsArrowRight aria-hidden="true" /></Link>
    );
    return (
        <div className="java-offer">
            <a className="java-skip" href="#java-content">{t("Przejdź do oferty")}</a>
            <nav className="java-nav" aria-label={t("Nawigacja kursu Java")}>
                <Link reloadDocument to="/" className="java-brand"><BsMortarboard aria-hidden="true" /> EduHub</Link>
                <div><a href="#program">{t("Program")}</a><a href="#dostep">{t("Dostęp i cena")}</a><Link reloadDocument to={user ? "/courses" : offer ? `/login?course=${offer.id}` : "/login"}>{user ? t("Moje kursy") : t("Zaloguj się")}</Link></div>
                <LocaleControls compact />
            </nav>
            <main id="java-content">
                <nav className="java-breadcrumb java-container" aria-label={t("Ścieżka nawigacji")}><ol><li><Link reloadDocument to="/">EduHub</Link></li><li aria-current="page">{t("Kurs Java Backend Developer")}</li></ol></nav>
                <header className="java-hero java-container">
                    <div className="java-hero-copy">
                        <p className="java-kicker"><BsCodeSlash aria-hidden="true" /> Java Backend Developer</p>
                        <h1>{t("Kurs Java online od podstaw.")}<br /><span>{t("Java Backend Developer.")}</span></h1>
                        <p className="java-lead">{t("Zacznij pisać w Javie i rozumiej swój kod. Kurs dla początkujących z uporządkowanym planem nauki, ćwiczeniami w edytorze i wskazówkami do rozwiązań. Uczysz się we własnym tempie.")}</p>
                        <div className="java-hero-actions"><a href="#dostep" className="java-primary-link">{t("Sprawdź dostęp do kursu")}{" "}<BsArrowRight aria-hidden="true" /></a><a href="#program" className="java-text-link">{t("Zobacz program ↓")}</a></div>
                        <ul className="java-hero-facts"><li><BsCheck2 />{" "}{t("Nauka we własnym tempie")}</li><li><BsCheck2 />{" "}{t("Praktyka w edytorze")}</li><li><BsCheck2 />{" "}{t("Zapis postępu na koncie")}</li></ul>
                    </div>
                    <PracticePreview />
                </header>

                <section className="java-container java-section" aria-labelledby="method-title">
                    <div className="java-section-heading"><p className="java-kicker">{t("Od wiedzy do działania")}</p><h2 id="method-title">{t("Nauka Javy przez praktyczne ćwiczenia")}</h2><p>{courseDescription === JAVA_COURSE_DESCRIPTION ? t(courseDescription) : courseDescription}</p></div>
                    <div className="java-method-grid">{[
                        ["01", "Poznaj jedną rzecz", "Pracuj z materiałem lekcji, zanim przejdziesz do zadania."],
                        ["02", "Napisz własny kod", "Przenieś poznaną zasadę do swojego rozwiązania w edytorze."],
                        ["03", "Zobacz informację zwrotną", "W automatycznie sprawdzanych zadaniach otrzymasz wynik i wskazówki do poprawy."],
                        ["04", "Idź dalej z postępem", "Wracaj do lekcji i śledź ukończone elementy kursu na swoim koncie."]
                    ].map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{t(title)}</h3><p>{t(text)}</p></article>)}</div>
                </section>

                <section id="program" className="java-container java-section" aria-labelledby="program-title">
                    <div className="java-section-heading"><p className="java-kicker">{t("Program i dostępne materiały")}</p><h2 id="program-title">{t("Program kursu Java Backend Developer")}</h2><p>{t("Kurs jest dla osób rozpoczynających naukę Javy oraz tych, które chcą uporządkować podstawy. Zaczynasz od środowiska pracy i prostych instrukcji, a następnie przechodzisz do kolejnych zagadnień. Oto tematy otwierające ścieżkę nauki.")}</p></div>
                    <div className="java-topic-grid">{JAVA_COURSE_TOPICS.map(topic => <article key={topic.title}><h3>{t(topic.title)}</h3><p>{t(topic.description)}</p></article>)}</div>
                    <h3 className="java-current-outline-title">{t("Aktualny program i dostępne lekcje")}</h3>
                    {loading ? <p role="status">{t("Pobieranie aktualnego programu i ceny…")}</p> : error ? <p className="java-notice" role="alert">{t(error)}</p> : <>
                        <div className="java-metrics"><div><strong>{formatNumber(offer.plannedLessonCount)}</strong><span>{t("lekcji w programie kursu")}</span></div><div><strong>{formatNumber(offer.stageCount)}</strong><span>{t("etapów ścieżki nauki")}</span></div></div>
                        <p className="java-plan-note">{t("Po zakupie otrzymujesz dostęp do udostępnionych lekcji na swoim koncie. Program przedstawia pełną ścieżkę nauki; materiały są udostępniane etapami.")}</p>
                        {offer.outline?.length > 0 && <div className="java-outline"><h3>{t("Początek planu kursu")}</h3><ol>{offer.outline.map(stage => <li key={stage.stageNumber}><span>{String(stage.stageNumber).padStart(2, "0")}</span>{stage.title}</li>)}</ol></div>}
                    </>}
                </section>

                <section id="dostep" className="java-container java-section" aria-labelledby="access-title">
                    <div className="java-section-heading"><p className="java-kicker">{t("Wybierz swój sposób nauki")}</p><h2 id="access-title">{t("Cena kursu Java i warianty dostępu")}</h2><p>{t("Cena i warianty poniżej są pobierane z aktualnej oferty kursu. Założenie konta nie uruchamia płatności.")}</p></div>
                    {loading ? <p role="status">{t("Pobieranie wariantów dostępu…")}</p> : !offer ? <div className="java-notice">{t("Aktualna oferta jest chwilowo niedostępna.")}{" "}{t(error)}</div> : plans.length === 0 ? <div className="java-notice">{t("Warunki dostępu są aktualizowane. Sprawdź ofertę ponownie później.")}</div> : <div className="java-price-grid">{plans.map(plan => <article className="java-price-card" key={plan.id}><p className="java-kicker">{t(plan.title)}</p><h3>{formatOfferPrice(plan.price, dateLocale)}{plan.id === "SUBSCRIPTION" && <small>{" "}{t("/ mies.")}</small>}</h3><p>{t(plan.renewal)}</p><ul><li><BsCheck2 />{" "}{t("Dostęp do udostępnionych lekcji kursu")}</li><li><BsCheck2 />{" "}{t("Ćwiczenia i zapis postępu na koncie")}</li><li><BsCheck2 />{" "}{t("Ostateczny wariant wybierzesz przed płatnością")}</li></ul>{checkoutLink(plan.id === "FREE" ? t("Przejdź do kursu") : t("Wybierz dostęp w EduHub"))}</article>)}</div>}
                    {offer && plans.length > 0 && <p className="java-plan-note">{user ? t("Po przejściu do panelu sprawdzisz szczegóły dostępu przed potwierdzeniem zamówienia.") : <>{t("Masz już konto?")}{" "}<Link reloadDocument to={`/login?course=${offer.id}`} onClick={() => rememberCoursePurchase(offer.id)}>{t("Zaloguj się i wróć do zakupu tego kursu.")}</Link></>}</p>}
                </section>

                <section className="java-container java-section java-faq" aria-labelledby="faq-title"><div className="java-section-heading"><p className="java-kicker">{t("Zanim zaczniesz")}</p><h2 id="faq-title">{t("Najczęstsze pytania o kurs Java online")}</h2></div>
                    <details><summary>{t("Czy ten kurs Java jest dla początkujących?")}</summary><p>{t("Tak. Początek programu obejmuje wyjaśnienie, czym jest programowanie, konfigurację środowiska i pierwszy program w Javie. Możesz zacząć od podstaw albo wrócić do tych tematów, aby uporządkować wcześniejszą wiedzę.")}</p></details>
                    <details><summary>{t("Czy nauka Javy obejmuje pisanie kodu?")}</summary><p>{t("Tak. W kursie pracujesz z ćwiczeniami w edytorze. W zadaniach sprawdzanych automatycznie otrzymujesz wynik i wskazówki, które pomagają poprawić rozwiązanie. Przykład takiego ćwiczenia znajdziesz na początku tej strony.")}</p></details>
                    <details><summary>{t("Czy mogę zobaczyć sposób nauki przed założeniem konta?")}</summary><p>{t("Tak. Na górze strony znajdziesz krótkie ćwiczenie z informacją zwrotną. Program i warianty dostępu również sprawdzisz bez logowania.")}</p></details>
                    <details><summary>{t("Co obejmuje dostęp do kursu?")}</summary><p>{t("Po potwierdzeniu zakupu możesz otwierać udostępnione lekcje i rozwiązywać zadania na swoim koncie. Program przedstawia całą ścieżkę nauki, a materiały są udostępniane etapami.")}</p></details>
                    <details><summary>{t("Czym różni się abonament od dostępu na 30 dni?")}</summary><p>{t("Abonament odnawia się automatycznie co miesiąc. Dostęp na 30 dni bez odnowienia wymaga jednej płatności. Dostęp bezterminowy, jeśli jest dostępny w ofercie, to osobny wariant. Na stronie pokazujemy wyłącznie warianty aktualnie skonfigurowane dla kursu.")}</p></details>
                    <details><summary>{t("Co dzieje się po płatności?")}</summary><p>{t("Po potwierdzeniu płatności dostęp zostaje przypisany do konta, na którym złożysz zamówienie. Możesz przejść do kursu i rozpocząć naukę.")}</p></details>
                    <details><summary>{t("Czy muszę uczyć się o określonych godzinach?")}</summary><p>{t("Nie ma tu harmonogramu spotkań na żywo. Pracujesz z opublikowanymi materiałami we własnym tempie, w okresie wynikającym z wybranego wariantu dostępu.")}</p></details>
                </section>
            </main>
            <footer className="java-footer java-container"><Link reloadDocument to="/" className="java-brand"><BsMortarboard aria-hidden="true" /> EduHub</Link><span>{t("Java Backend Developer · Nauka przez praktykę")}</span><Link reloadDocument to="/pomoc">{t("Pomoc i kontakt")}</Link><a href="#java-content">{t("Wróć na górę ↑")}</a></footer>
        </div>
    );
}

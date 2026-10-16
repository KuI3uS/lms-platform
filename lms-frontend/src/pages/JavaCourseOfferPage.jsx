import { useState } from "react";
import { Link } from "react-router-dom";
import { BsArrowRight, BsCheck2, BsCodeSlash, BsMortarboard, BsTerminal } from "react-icons/bs";
import { useAuth } from "../context/AuthContext";
import usePublicJavaOffer from "../hooks/usePublicJavaOffer";
import { formatOfferPrice, getCourseDescription, getPublicOfferPlans } from "../utils/javaCourseOffer";
import { rememberCoursePurchase } from "../utils/coursePurchaseIntent";
import "../styles/java-course-offer.css";

function PracticePreview() {
    const [answer, setAnswer] = useState("");
    const [result, setResult] = useState(null);
    return (
        <section className="java-practice" aria-labelledby="practice-title">
            <div className="java-terminal-bar"><span><i /><i /><i /></span><span>Main.java</span><BsTerminal aria-hidden="true" /></div>
            <div className="java-practice-inner">
                <p className="java-kicker">Spróbuj przed założeniem konta</p>
                <h2 id="practice-title">Jaki wynik wypisze program?</h2>
                <p>Trzy ukończone lekcje. Po 20 punktów za każdą.</p>
                <pre><code><span className="java-code-muted">// Oblicz zdobyte punkty</span>{"\n"}<span className="java-code-keyword">int</span>{" lessons = 3;\n"}<span className="java-code-keyword">int</span>{" xpPerLesson = 20;\n\n"}<span className="java-code-call">System.out.println</span>{"(\n    lessons * xpPerLesson\n);"}</code></pre>
                <form onSubmit={event => {
                    event.preventDefault();
                    setResult(!answer.trim() ? "empty" : answer.trim() === "60" ? "correct" : "retry");
                }}>
                    <label htmlFor="java-demo-answer">Wpisz wynik programu</label>
                    <div className="java-demo-controls"><input id="java-demo-answer" inputMode="numeric" autoComplete="off" placeholder="Twoja odpowiedź" value={answer} onChange={event => { setAnswer(event.target.value); setResult(null); }} /><button type="submit">Sprawdź <BsArrowRight aria-hidden="true" /></button></div>
                </form>
                <p className={`java-demo-result ${result === "correct" ? "is-correct" : ""}`} role="status" aria-live="polite">
                    {result === "correct" ? "Dobrze! 3 × 20 = 60. Rozumiesz wynik, a nie tylko przepisujesz kod."
                        : result === "retry" ? "Spróbuj jeszcze raz. Pomnóż liczbę lekcji przez punkty za jedną lekcję."
                            : result === "empty" ? "Najpierw wpisz swoją odpowiedź." : "Przykładowe ćwiczenie na tej stronie. Wynik nie jest zapisywany w kursie."}
                </p>
            </div>
        </section>
    );
}

export default function JavaCourseOfferPage() {
    const { user } = useAuth();
    const { offer, loading, error } = usePublicJavaOffer();
    const plans = getPublicOfferPlans(offer);
    const hasMaterials = Number(offer?.availableLessonCount || 0) > 0;
    const destination = offer ? user ? `/checkout/${offer.id}` : `/register?course=${offer.id}` : "/register";
    const checkoutLink = (label, className = "java-primary-link") => (
        <Link className={className} to={destination} onClick={() => offer && rememberCoursePurchase(offer.id)}>{label}<BsArrowRight aria-hidden="true" /></Link>
    );
    return (
        <div className="java-offer">
            <a className="java-skip" href="#java-content">Przejdź do oferty</a>
            <nav className="java-nav" aria-label="Nawigacja kursu Java">
                <Link to="/" className="java-brand"><BsMortarboard aria-hidden="true" /> EduHub</Link>
                <div><a href="#program">Program</a><a href="#dostep">Dostęp i cena</a><Link to={user ? "/courses" : offer ? `/login?course=${offer.id}` : "/login"}>{user ? "Moje kursy" : "Zaloguj się"}</Link></div>
            </nav>
            <main id="java-content">
                <header className="java-hero java-container">
                    <div className="java-hero-copy">
                        <p className="java-kicker"><BsCodeSlash aria-hidden="true" /> Java Backend Developer</p>
                        <h1>Zacznij pisać w Javie.<br /><span>Rozumiej swój kod.</span></h1>
                        <p className="java-lead">Od pierwszych instrukcji do myślenia jak programista. Uporządkowany plan, własne rozwiązania i wskazówki, które pomagają zrobić następny krok.</p>
                        <div className="java-hero-actions"><a href="#dostep" className="java-primary-link">Sprawdź dostęp do kursu <BsArrowRight aria-hidden="true" /></a><a href="#program" className="java-text-link">Zobacz program ↓</a></div>
                        <ul className="java-hero-facts"><li><BsCheck2 /> Nauka we własnym tempie</li><li><BsCheck2 /> Praktyka w edytorze</li><li><BsCheck2 /> Zapis postępu na koncie</li></ul>
                    </div>
                    <PracticePreview />
                </header>

                <section className="java-container java-section" aria-labelledby="method-title">
                    <div className="java-section-heading"><p className="java-kicker">Od wiedzy do działania</p><h2 id="method-title">Przeczytaj. Napisz. Sprawdź. Popraw.</h2><p>{getCourseDescription(offer || { title: "Java Backend Developer" })}</p></div>
                    <div className="java-method-grid">{[
                        ["01", "Poznaj jedną rzecz", "Pracuj z materiałem lekcji, zanim przejdziesz do zadania."],
                        ["02", "Napisz własny kod", "Przenieś poznaną zasadę do swojego rozwiązania w edytorze."],
                        ["03", "Zobacz informację zwrotną", "W automatycznie sprawdzanych zadaniach otrzymasz wynik i wskazówki do poprawy."],
                        ["04", "Idź dalej z postępem", "Wracaj do lekcji i śledź ukończone elementy kursu na swoim koncie."]
                    ].map(([number, title, text]) => <article key={number}><span>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div>
                </section>

                <section id="program" className="java-container java-section" aria-labelledby="program-title">
                    <div className="java-section-heading"><p className="java-kicker">Program i dostępne materiały</p><h2 id="program-title">Wiesz, od czego zacząć.</h2><p>Kurs jest dla osób rozpoczynających naukę Javy oraz tych, które chcą uporządkować podstawy. Poniżej widzisz bieżący stan materiałów i fragment planu, pobrane z EduHub.</p></div>
                    {loading ? <p role="status">Pobieranie aktualnego programu i ceny…</p> : error ? <p className="java-notice" role="alert">{error}</p> : <>
                        <div className="java-metrics"><div><strong>{offer.availableLessonCount}</strong><span>opublikowanych lekcji z materiałem</span></div><div><strong>{offer.plannedLessonCount}</strong><span>lekcji w planie kursu</span></div><div><strong>{offer.stageCount}</strong><span>etapów w planie kursu</span></div></div>
                        <p className="java-plan-note">Plan obejmuje również elementy w przygotowaniu. Dostęp dotyczy opublikowanych materiałów; sama liczba etapów nie oznacza, że wszystkie lekcje są już gotowe.</p>
                        {offer.outline?.length > 0 && <div className="java-outline"><h3>Początek planu kursu</h3><ol>{offer.outline.map(stage => <li key={stage.stageNumber}><span>{String(stage.stageNumber).padStart(2, "0")}</span>{stage.title}</li>)}</ol></div>}
                    </>}
                </section>

                <section id="dostep" className="java-container java-section" aria-labelledby="access-title">
                    <div className="java-section-heading"><p className="java-kicker">Wybierz swój sposób nauki</p><h2 id="access-title">Jasne zasady dostępu.</h2><p>Cena i warianty poniżej są pobierane z aktualnej oferty kursu. Założenie konta nie uruchamia płatności.</p></div>
                    {loading ? <p role="status">Pobieranie wariantów dostępu…</p> : !offer ? <div className="java-notice">Aktualna oferta jest chwilowo niedostępna. {error}</div> : !hasMaterials ? <div className="java-notice">Kurs jest w przygotowaniu. Na tej stronie pojawi się możliwość przejścia do zakupu, gdy będą dostępne opublikowane lekcje z materiałem.</div> : plans.length === 0 ? <div className="java-notice">Warunki dostępu są aktualizowane. Sprawdź ofertę ponownie później.</div> : <div className="java-price-grid">{plans.map(plan => <article className="java-price-card" key={plan.id}><p className="java-kicker">{plan.title}</p><h3>{formatOfferPrice(plan.price)}{plan.id === "SUBSCRIPTION" && <small> / mies.</small>}</h3><p>{plan.renewal}</p><ul><li><BsCheck2 /> Dostęp do opublikowanych materiałów kursu</li><li><BsCheck2 /> Ćwiczenia i zapis postępu na koncie</li><li><BsCheck2 /> Ostateczny wariant wybierzesz przed płatnością</li></ul>{checkoutLink(plan.id === "FREE" ? "Przejdź do kursu" : "Wybierz dostęp w EduHub")}</article>)}</div>}
                    {offer && hasMaterials && plans.length > 0 && <p className="java-plan-note">{user ? "Po przejściu do panelu sprawdzisz szczegóły dostępu przed potwierdzeniem zamówienia." : <>Masz już konto? <Link to={`/login?course=${offer.id}`} onClick={() => rememberCoursePurchase(offer.id)}>Zaloguj się i wróć do zakupu tego kursu.</Link></>}</p>}
                </section>

                <section className="java-container java-section java-faq" aria-labelledby="faq-title"><div className="java-section-heading"><p className="java-kicker">Zanim zaczniesz</p><h2 id="faq-title">Pytania o kurs.</h2></div>
                    <details><summary>Czy mogę zobaczyć sposób nauki przed założeniem konta?</summary><p>Tak. Na górze strony znajdziesz krótkie ćwiczenie z informacją zwrotną. Program i bieżącą liczbę opublikowanych lekcji również sprawdzisz bez logowania.</p></details>
                    <details><summary>Czy cały plan kursu jest już gotowy?</summary><p>Liczba lekcji w planie i liczba opublikowanych lekcji z materiałem są pokazane oddzielnie w sekcji programu. Sprawdź te wartości przed zakupem. Plan nie jest obietnicą określonego terminu publikacji kolejnych lekcji.</p></details>
                    <details><summary>Czym różni się abonament od dostępu na 30 dni?</summary><p>Abonament odnawia się automatycznie co miesiąc. Dostęp na 30 dni bez odnowienia wymaga jednej płatności. Dostęp bezterminowy, jeśli jest dostępny w ofercie, to osobny wariant. Na stronie pokazujemy wyłącznie warianty aktualnie skonfigurowane dla kursu.</p></details>
                    <details><summary>Co dzieje się po płatności?</summary><p>Po potwierdzeniu płatności dostęp zostaje przypisany do konta, na którym złożysz zamówienie. Możesz przejść do kursu i rozpocząć naukę.</p></details>
                    <details><summary>Czy muszę uczyć się o określonych godzinach?</summary><p>Nie ma tu harmonogramu spotkań na żywo. Pracujesz z opublikowanymi materiałami we własnym tempie, w okresie wynikającym z wybranego wariantu dostępu.</p></details>
                </section>
            </main>
            <footer className="java-footer java-container"><Link to="/" className="java-brand"><BsMortarboard aria-hidden="true" /> EduHub</Link><span>Java Backend Developer · Nauka przez praktykę</span><a href="#java-content">Wróć na górę ↑</a></footer>
        </div>
    );
}

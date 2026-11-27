import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import PublicLearningShell, { PolishLearningNotice } from "../components/PublicLearningShell";
import { useLocale } from "../context/LocaleContext";
import { INF03_QUESTIONS, gradeInf03Practice } from "../utils/inf03Practice";

function PracticeTest() {
    const [answers, setAnswers] = useState({});
    const [result, setResult] = useState(null);
    const summary = useRef(null);
    return <form onSubmit={event => { event.preventDefault(); setResult(gradeInf03Practice(answers)); summary.current?.focus(); }}>
        <div className="pl-questions">{INF03_QUESTIONS.map(item => <fieldset key={item.id}>
            <legend><span className="pl-eyebrow">{item.topic}</span><span>{item.question}</span></legend>
            <div className="pl-options">{item.options.map((option, index) => <label key={index} className={result?.complete && index === item.correct ? "is-correct" : result?.complete && answers[item.id] === index ? "is-incorrect" : ""}>
                <input type="radio" name={item.id} value={index} checked={answers[item.id] === index} onChange={() => { setAnswers(current => ({ ...current, [item.id]: index })); setResult(null); }} /><span>{option}</span>
                {result?.complete && index === item.correct && <strong>Poprawna odpowiedź</strong>}
                {result?.complete && answers[item.id] === index && index !== item.correct && <strong>Twoja odpowiedź — do poprawy</strong>}
            </label>)}</div>
            {result?.complete && <p className="pl-explanation">{item.explanation}</p>}
        </fieldset>)}</div>
        <div className="pl-quiz-summary" ref={summary} tabIndex={-1} role="status" aria-live="polite">
            {result && <p>{result.complete ? `Twój wynik: ${result.correct} z ${result.total}. Przeczytaj wyjaśnienia przy pytaniach i wróć do tematów, które wymagają powtórki.` : `Odpowiedz na wszystkie pytania. Zaznaczono ${result.answered} z ${result.total}.`}</p>}
        </div>
        <div className="pl-actions"><button className="pl-button" type="submit">Sprawdź odpowiedzi</button><button className="pl-link" type="button" onClick={() => { setAnswers({}); setResult(null); }}>Zacznij od nowa</button></div>
        <noscript>Włącz JavaScript, aby zaznaczać i sprawdzać odpowiedzi. Pytania i klucz z wyjaśnieniami są również dostępne na tej stronie bez uruchamiania testu.</noscript>
    </form>;
}

export default function Inf03PublicPage() {
    const { language } = useLocale();
    return <PublicLearningShell>{language !== "pl" ? <PolishLearningNotice /> : <>
        <div className="pl-container pl-breadcrumb"><Link reloadDocument to="/">EduHub</Link><span>/</span><span>Testy INF.03</span></div>
        <header className="pl-container pl-hero pl-hero-exam">
            <div><p className="pl-eyebrow">Przygotowanie do egzaminu zawodowego</p><h1>Testy INF.03.<br /><em>Nie zgaduj.<br />Zrozum odpowiedź.</em></h1>
                <p className="pl-lead">Poćwicz HTML, CSS, JavaScript, PHP i bazy danych. Zacznij od krótkiego testu online — po sprawdzeniu zobaczysz nie tylko wynik, lecz także wyjaśnienie każdej odpowiedzi.</p>
                <div className="pl-actions"><a className="pl-button" href="#test">Rozwiąż test bez logowania</a><Link reloadDocument className="pl-link" to="/exams">Egzaminy na platformie</Link></div>
                <ul className="pl-inline-facts"><li>6 autorskich pytań</li><li>Bez limitu czasu</li><li>Z wyjaśnieniami</li></ul>
            </div><aside className="pl-exam-note"><p className="pl-eyebrow">Przykład sposobu myślenia</p><h2>WHERE czy<br />ORDER BY?</h2><pre><code>{"SELECT * FROM produkty\nWHERE cena > 100;"}</code></pre><p><strong>WHERE</strong> wybiera rekordy spełniające warunek. <strong>ORDER BY</strong> ustala ich kolejność. To dwie różne operacje — dlatego warto rozumieć kod, a nie zapamiętywać litery odpowiedzi.</p></aside>
        </header>
        <section id="test" className="pl-band"><div className="pl-container pl-section" aria-labelledby="inf-test-title">
            <div className="pl-section-heading"><div><p className="pl-eyebrow">Sprawdź podstawy</p><h2 id="inf-test-title">Krótki test INF.03 online</h2></div><p>Zaznacz jedną odpowiedź przy każdym pytaniu. To autorski zestaw treningowy EduHub, nie oficjalny arkusz CKE ani pełny egzamin. Wynik nie jest zapisywany na koncie.</p></div>
            <PracticeTest />
        </div></section>
        <section className="pl-container pl-section" aria-labelledby="inf-study-title"><div className="pl-section-heading"><div><p className="pl-eyebrow">Co dalej po teście?</p><h2 id="inf-study-title">Zamień pomyłkę<br />w temat do powtórki.</h2></div><p>INF.03 dotyczy tworzenia i administrowania stronami i aplikacjami internetowymi oraz bazami danych. Test jest punktem startowym; nie zastępuje pracy z kodem i zadaniami praktycznymi.</p></div>
            <div className="pl-study-topics"><article><h3>HTML i CSS</h3><p>Odtwórz prosty formularz. Połącz etykiety z polami i sprawdź, które elementy wybiera selektor klasy, a które selektor id.</p></article><article><h3>JavaScript i PHP</h3><p>Przewidź wynik krótkiego fragmentu, a potem go uruchom. Zwróć uwagę na typ danych, operator i miejsce wykonania skryptu.</p></article><article><h3>SQL i bazy danych</h3><p>Zapisz własne zapytanie z WHERE. Zmień warunek i przewidź wynik. Porównaj filtrowanie rekordów z ich sortowaniem.</p></article></div>
            <div className="pl-actions"><Link reloadDocument className="pl-button" to="/courses">Sprawdź kursy INF.03</Link><Link reloadDocument className="pl-link" to="/tutoring-booking">Zapytaj o trudne zadanie na korepetycjach</Link></div>
        </section>
        <section className="pl-container pl-section pl-answer-key" aria-labelledby="inf-key"><h2 id="inf-key">Klucz odpowiedzi i wyjaśnienia</h2><p>Wróć tutaj po samodzielnej próbie. Klucz pozostaje dostępny także bez uruchamiania testu.</p>{INF03_QUESTIONS.map(item => <details key={item.id}><summary>{item.topic}: {item.question}</summary><p><strong>{item.options[item.correct]}</strong></p><p>{item.explanation}</p></details>)}</section>
        <section className="pl-container pl-section pl-faq" aria-labelledby="inf-faq"><h2 id="inf-faq">Pytania o przygotowanie do INF.03</h2>
            <details><summary>Czy ten test jest darmowy?</summary><p>Tak. Sześć pytań na tej stronie oraz ich wyjaśnienia są dostępne bez konta i opłat. Kursy i egzaminy wewnątrz platformy mają własne warunki dostępu, które sprawdzisz na koncie.</p></details>
            <details><summary>Czy są to pytania z oficjalnych egzaminów?</summary><p>Nie. To autorskie pytania edukacyjne EduHub. Oficjalny zakres i materiały egzaminacyjne sprawdzaj w aktualnych dokumentach Centralnej Komisji Egzaminacyjnej.</p></details>
            <details><summary>Czy same testy wystarczą do przygotowania?</summary><p>Nie traktuj ich jako całego przygotowania. Poza teorią ćwicz pisanie kodu, zapytań SQL i pracę w swoim środowisku. Po każdym błędzie ustal, dlaczego wybrana odpowiedź była niepoprawna.</p></details>
        </section>
    </>}</PublicLearningShell>;
}

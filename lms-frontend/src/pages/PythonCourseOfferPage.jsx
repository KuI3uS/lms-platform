import { Link } from "react-router-dom";
import PublicLearningShell, { PolishLearningNotice } from "../components/PublicLearningShell";
import { useLocale } from "../context/LocaleContext";
import { useAuth } from "../context/AuthContext";
import usePublicCourseOffer from "../hooks/usePublicCourseOffer";
import { formatOfferPrice, getPublicOfferPlans, getCourseDescription } from "../utils/javaCourseOffer";
import { PYTHON_COURSE_SLUG, PYTHON_COURSE_NAME } from "../utils/pythonCourseOffer";
import { rememberCoursePurchase } from "../utils/coursePurchaseIntent";

export default function PythonCourseOfferPage() {
    const { language, dateLocale } = useLocale();
    const { user } = useAuth();
    const { offer, loading, unavailable, error } = usePublicCourseOffer(PYTHON_COURSE_SLUG);
    const plans = getPublicOfferPlans(offer);
    const destination = offer ? user ? `/checkout/${offer.id}` : `/register?course=${offer.id}` : null;
    return <PublicLearningShell>{language !== "pl" ? <PolishLearningNotice /> : <>
        <div className="pl-container pl-breadcrumb"><Link reloadDocument to="/">EduHub</Link><span>/</span><span>Python + AI</span></div>
        <section className="pl-container pl-hero" aria-labelledby="python-title">
            <div><p className="pl-eyebrow">Kurs online · automatyzacje dla biznesu</p>
                <h1 id="python-title">Python + AI.<br /><em>Mniej rutyny.<br />Więcej możliwości.</em></h1>
                <p className="pl-lead">Chcesz wyjść poza samo korzystanie z narzędzi AI? Poznaj Pythona w kontekście automatyzacji i ucz się tworzyć własne rozwiązania — krok po kroku, od podstaw.</p>
                <div className="pl-actions"><a className="pl-button" href="#program">Zobacz program kursu</a><a className="pl-link" href="#dostep">Sprawdź cenę i dostęp</a></div>
                <ul className="pl-inline-facts"><li>Od podstaw</li><li>Po polsku</li><li>Własne tempo</li></ul>
            </div>
            <aside className="pl-code-sheet" aria-label="Przykład idei automatyzacji w Pythonie">
                <div className="pl-sheet-header"><span>Od reguły do działania</span><span>Python</span></div>
                <pre><code>{'zamowienia = [\n    {"nr": "A-12", "oplacone": True},\n    {"nr": "A-13", "oplacone": False},\n]\n\nfor zamowienie in zamowienia:\n    if zamowienie["oplacone"]:\n        print(zamowienie["nr"])'}</code></pre>
                <div className="pl-code-output"><span>Wynik</span><samp>A-12</samp></div>
                <p>Mały przykład: wybierasz opłacone zamówienia według jednej reguły. To ilustracja automatyzacji, nie pokaz działania AI ani gotowy system biznesowy.</p>
            </aside>
        </section>
        <section className="pl-band"><div className="pl-container pl-editorial">
            <div><p className="pl-eyebrow">Dla kogo jest ten kurs?</p><h2>Masz pomysł.<br />Zacznij rozumieć, jak go zbudować.</h2></div>
            <div><p>Kurs kierujemy do osób, które chcą poznawać programowanie przez jego zastosowania w pracy i biznesie. Nie musisz na starcie znać Pythona. Potrzebujesz czasu na naukę, ćwiczenia i poprawianie własnych rozwiązań.</p><p>{getCourseDescription(offer || { title: PYTHON_COURSE_NAME })}</p><p className="pl-note">Szukasz wdrożenia wykonanego za Ciebie? To kurs do samodzielnej nauki, nie usługa automatyzacji Twojej firmy. Nie obiecujemy konkretnego przychodu ani oszczędności czasu.</p></div>
        </div></section>
        <section id="program" className="pl-container pl-section" aria-labelledby="python-program">
            <div className="pl-section-heading"><div><p className="pl-eyebrow">Zajrzyj do środka przed zakupem</p><h2 id="python-program">Program kursu</h2></div><p>Lista poniżej pochodzi z aktualnego planu w EduHub. Materiały poszczególnych lekcji otworzysz na swoim koncie po uzyskaniu dostępu.</p></div>
            <div aria-live="polite">
                {loading ? <p className="pl-state" role="status">Pobieranie aktualnego programu i ceny…</p>
                    : !offer ? <div className="pl-state"><h3>{unavailable ? "Oferta nie jest obecnie dostępna." : "Nie udało się pobrać programu."}</h3><p>{unavailable ? "Sprawdź ponownie później lub skontaktuj się z nami przed zakupem." : error}</p><Link reloadDocument className="pl-link" to="/pomoc">Pomoc i kontakt</Link></div>
                        : <><dl className="pl-course-facts"><div><dt>Etapy w planie</dt><dd>{offer.stageCount}</dd></div><div><dt>Lekcje w planie</dt><dd>{offer.plannedLessonCount}</dd></div><div><dt>Język materiałów</dt><dd>Polski</dd></div></dl>
                            {offer.outline?.length ? <ol className="pl-outline">{offer.outline.map(stage => <li key={stage.stageNumber}><span>Etap {stage.stageNumber}</span><h3>{stage.title}</h3></li>)}</ol> : <p className="pl-state">Szczegółowy plan nie został jeszcze udostępniony.</p>}
                            <p className="pl-note">Liczba lekcji opisuje plan kursu. Uczysz się na opublikowanych materiałach; kolejne treści mogą być udostępniane etapami.</p></>}
            </div>
        </section>
        <section id="dostep" className="pl-band"><div className="pl-container pl-access">
            <div><p className="pl-eyebrow">Twoja decyzja, bez pośpiechu</p><h2>Sprawdź warunki.<br />Wybierz swój kolejny krok.</h2><p>Cena i warianty obok są pobierane z aktualnej oferty. Przed płatnością zobaczysz podsumowanie zamówienia na swoim koncie.</p><p className="pl-note">Założenie konta nie uruchamia płatności. Korzystanie z zewnętrznych narzędzi AI może wymagać osobnego konta lub opłat u ich dostawców; cena kursu nie oznacza opłacenia tych usług.</p></div>
            <div className="pl-price-panel" aria-live="polite">{loading ? <p role="status">Pobieranie aktualnej oferty…</p> : plans.length ? <>
                {plans.map(plan => <div className="pl-plan" key={plan.id}><h3>{plan.title}</h3><p className="pl-price">{formatOfferPrice(plan.price, dateLocale)}{plan.id === "SUBSCRIPTION" && <small> / mies.</small>}</p><p>{plan.renewal}</p></div>)}
                <Link reloadDocument className="pl-button" to={destination} onClick={() => rememberCoursePurchase(offer.id)}>Przejdź do wyboru dostępu</Link><p className="pl-note">Dostęp przypiszemy do konta użytego przy zamówieniu po potwierdzeniu płatności.</p>
            </> : <><h3>Zakup chwilowo niedostępny</h3><p>Nie pokazujemy zastępczej ceny. Zapytaj nas o aktualne warunki dostępu.</p><Link reloadDocument className="pl-link" to="/pomoc">Pomoc i kontakt</Link></>}</div>
        </div></section>
        <section className="pl-container pl-section pl-faq" aria-labelledby="python-faq"><h2 id="python-faq">Zanim zaczniesz</h2>
            <details><summary>Czy to kurs po polsku?</summary><p>Tak. Ta oferta dotyczy polskiej wersji materiałów. Przełączenie języka interfejsu nie tłumaczy automatycznie kursu.</p></details>
            <details><summary>Czy mogę uczyć się po pracy?</summary><p>Tak. Pracujesz z udostępnionymi materiałami we własnym tempie, w okresie wynikającym z wybranego wariantu dostępu.</p></details>
            <details><summary>Co zobaczę po zakupie?</summary><p>Po potwierdzeniu płatności na Twoim koncie pojawi się dostęp do kursu i jego opublikowanych lekcji. Możesz realizować etapy i wracać do swojego postępu.</p></details>
            <details><summary>Czy jest to obietnica zarobków lub gotowego wdrożenia?</summary><p>Nie. To nauka, która wymaga Twojej pracy. Program i ćwiczenia nie gwarantują określonych wyników finansowych, pracy ani gotowej automatyzacji dopasowanej do każdej firmy.</p></details>
        </section>
    </>}</PublicLearningShell>;
}

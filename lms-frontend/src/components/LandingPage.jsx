import { useLocale } from "../context/LocaleContext";
import LocaleControls from "./LocaleControls";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BsArrowDown,
  BsArrowRight,
  BsArrowUpRight,
  BsBook,
  BsCalendarCheck,
  BsCheck2,
  BsCheckCircleFill,
  BsCodeSlash,
  BsGithub,
  BsLayers,
  BsLinkedin,
  BsList,
  BsMortarboard,
  BsPlayFill,
  BsTerminal,
  BsX,
} from "react-icons/bs";
import usePublicJavaOffer from "../hooks/usePublicJavaOffer";
import {
  formatOfferPrice,
  getPublicOfferPlans,
  JAVA_COURSE_PATH,
} from "../utils/javaCourseOffer";
import {
  HOME_FAQ,
  LEARNING_PATHS,
  PRACTICE_EXAMPLES,
  checkPracticeAnswer,
} from "../utils/homeContent";
import "../styles/landing.css";

function Brand({ footer = false }) {
    const { t } = useLocale();
  return (
    <a
      className="eh-brand"
      href={footer ? "#start" : "/"}
      aria-label={t("EduHub — strona główna")}
    >
      <span className="eh-brand-mark">
        <BsMortarboard aria-hidden="true" />
      </span>
      <span>
        edu<span className="eh-brand-light">hub</span>
        <span className="eh-brand-dot">.</span>
      </span>
    </a>
  );
}
function CourseLink({
  children = "Poznaj kurs Java",
  secondary = false,
  className = "",
}) {
  const { t, language } = useLocale();
  return (
    <Link
      reloadDocument
      to={`${JAVA_COURSE_PATH}?lang=${language}`}
      className={
        (secondary
          ? "eh-button eh-button-secondary "
          : "eh-button eh-button-primary ") + className
      }
    >
      {typeof children === "string" ? t(children) : children}
      <BsArrowUpRight aria-hidden="true" />
    </Link>
  );
}
function PracticeStudio() {
    const { t } = useLocale();
  const [active, setActive] = useState("java");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null);
  const example = PRACTICE_EXAMPLES.find((item) => item.id === active);
  const changeExample = (id) => {
    setActive(id);
    setAnswer("");
    setResult(null);
  };
  return (
    <section
      id="wyprobuj"
      className="eh-studio"
      aria-labelledby="eh-studio-title"
    >
      <div className="eh-studio-top">
        <span className="eh-window-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>{t("Twoja pierwsza lekcja")}</span>
        <span className="eh-demo-badge">DEMO</span>
      </div>
      <div
        className="eh-studio-tabs"
        role="tablist"
        aria-label={t("Wybierz przykładowe zadanie")}
      >
        {PRACTICE_EXAMPLES.map((item, index) => (
          <button
            key={item.id}
            id={"eh-tab-" + item.id}
            type="button"
            role="tab"
            aria-selected={active === item.id}
            aria-controls="eh-practice-panel"
            tabIndex={active === item.id ? 0 : -1}
            onClick={() => changeExample(item.id)}
            onKeyDown={(event) => {
              if (
                !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)
              )
                return;
              event.preventDefault();
              const nextIndex =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? PRACTICE_EXAMPLES.length - 1
                    : (index +
                        (event.key === "ArrowRight" ? 1 : -1) +
                        PRACTICE_EXAMPLES.length) %
                      PRACTICE_EXAMPLES.length;
              const next = PRACTICE_EXAMPLES[nextIndex].id;
              changeExample(next);
              event.currentTarget.parentElement
                .querySelector("#eh-tab-" + next)
                ?.focus();
            }}
          >
            <BsCodeSlash aria-hidden="true" />
            {t(item.label)}
          </button>
        ))}
      </div>
      <div
        id="eh-practice-panel"
        role="tabpanel"
        aria-labelledby={"eh-tab-" + active}
        className="eh-studio-panel"
      >
        <div className="eh-code-heading">
          <span>{example.file}</span>
          <span>{t("Przykład w przeglądarce")}</span>
        </div>
        <div className="eh-code-editor">
          <div className="eh-line-numbers" aria-hidden="true">
            {example.code.split("\n").map((_, i) => (
              <span key={i}>{i + 1}</span>
            ))}
          </div>
          <pre>
            <code>{example.code}</code>
          </pre>
        </div>
        <div className="eh-challenge">
          <p className="eh-small-label">{t("TERAZ TWOJA KOLEJ")}</p>
          <h2 id="eh-studio-title">{t(example.question)}</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setResult(checkPracticeAnswer(active, answer));
            }}
          >
            <label className="eh-sr-only" htmlFor="eh-demo-answer">{t("Twoja odpowiedź")}</label>
            <div className="eh-answer-row">
              <input
                id="eh-demo-answer"
                autoComplete="off"
                value={answer}
                placeholder={t(example.placeholder)}
                onChange={(event) => {
                  setAnswer(event.target.value);
                  setResult(null);
                }}
              />
              <button className="eh-check-button" type="submit">{t("Sprawdź")}<BsArrowRight aria-hidden="true" />
              </button>
            </div>
          </form>
          <div
            className={
              "eh-feedback" +
              (result === "correct" ? " is-correct" : result ? " is-retry" : "")
            }
            role="status"
            aria-live="polite"
          >
            {result === "correct" ? (
              <>
                <BsCheckCircleFill aria-hidden="true" />
                {t(example.explanation)}
              </>
            ) : result === "retry" ? (
              t(example.hint)
            ) : result === "empty" ? (
              t("Wpisz odpowiedź, a potem sprawdź rozwiązanie.")
            ) : (
              <>
                <BsPlayFill aria-hidden="true" />{t("Sprawdź sposób nauki. Bez konta i bez zapisywania wyniku.")}</>
            )}
          </div>
        </div>
      </div>
      <div className="eh-studio-footer">
        <span>
          <BsCheck2 aria-hidden="true" />{" "}{t("Teoria")}</span>
        <span className="is-current">
          <BsCodeSlash aria-hidden="true" />{" "}{t("Praktyka")}</span>
        <span>
          <BsLayers aria-hidden="true" />{" "}{t("Kolejny krok")}</span>
      </div>
    </section>
  );
}
function JavaOffer() {
    const { t, dateLocale, language } = useLocale();
  const { offer, loading, error, unavailable } = usePublicJavaOffer();
  const plans = getPublicOfferPlans(offer);
  if (language !== "pl" && !offer) return <aside className="eh-course-access">
    <h3>{t(loading ? "Pobieranie aktualnej oferty…" : unavailable ? "Ten kurs nie ma jeszcze wersji w wybranym języku." : "Aktualna oferta jest chwilowo niedostępna.")}</h3>
    {!loading && <p>{t(unavailable ? "Kursy w tej wersji pojawią się po przygotowaniu i opublikowaniu materiałów w wybranym języku. Nie pokazujemy tu kursów w innych językach." : error)}</p>}
    <Link reloadDocument to="/courses" className="eh-button eh-button-primary">{t("Przejdź do katalogu")}</Link>
  </aside>;
  return (
    <aside
      className="eh-course-access"
      aria-label={t("Aktualny dostęp do kursu Java")}
    >
      <p className="eh-small-label">{t("TWÓJ KOLEJNY KROK")}</p>
      <h3>{t("Zacznij od solidnych podstaw.")}</h3>
      <p>{t("Sprawdź program i wybierz wariant dostępu, który pasuje do Twojej nauki.")}</p>
      <div className="eh-live-offer" aria-live="polite">
        {loading ? (
          <p role="status" className="eh-offer-status">{t("Pobieranie aktualnej oferty…")}</p>
        ) : error || !plans.length ? (
          <p className="eh-offer-status">{t("Aktualne warunki dostępu sprawdzisz na stronie kursu.")}</p>
        ) : (
          plans.map((plan) => (
            <div className="eh-price-row" key={plan.id}>
              <span>{t(plan.title)}</span>
              <strong>
                {formatOfferPrice(plan.price, dateLocale)}
                {plan.id === "SUBSCRIPTION" && <small>{" "}{t("/ mies.")}</small>}
              </strong>
            </div>
          ))
        )}
      </div>
      <CourseLink>{t("Program i dostęp do kursu")}</CourseLink>
      <p className="eh-access-note">{t("Materiały są udostępniane etapami. Założenie konta nie uruchamia płatności.")}</p>
    </aside>
  );
}
export default function LandingPage() {
    const { t } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pathFilter, setPathFilter] = useState("all");
  const paths = LEARNING_PATHS.filter(
    (path) => pathFilter === "all" || path.category === pathFilter,
  );
  const closeMenu = () => setMenuOpen(false);
  return (
    <div className="eh-home" id="start">
      <a className="eh-skip-link" href="#eh-main">{t("Przejdź do treści")}</a>
      <div className="eh-announcement">
        <span>{t("Nauka zaczyna się od praktyki.")}</span>
        <Link reloadDocument to={JAVA_COURSE_PATH}>{t("Odkryj Java Backend Developer")}{" "}<BsArrowRight aria-hidden="true" />
        </Link>
      </div>
      <header
        className="eh-header"
        onKeyDown={(event) => {
          if (event.key === "Escape" && menuOpen) {
            closeMenu();
            event.currentTarget.querySelector(".eh-menu-toggle")?.focus();
          }
        }}
      >
        <div className="eh-container eh-nav-inner">
          <Brand />
          <nav
            id="eh-navigation"
            className={"eh-navigation" + (menuOpen ? " is-open" : "")}
            aria-label={t("Główna nawigacja")}
          >
            <Link reloadDocument to={JAVA_COURSE_PATH} onClick={closeMenu}>{t("Kurs Java")}</Link>
            <a href="#metoda" onClick={closeMenu}>{t("Jak uczymy")}</a>
            <a href="#sciezki" onClick={closeMenu}>{t("Ścieżki nauki")}</a>
            <a href="#korepetycje" onClick={closeMenu}>{t("Korepetycje")}</a>
            <a href="#faq" onClick={closeMenu}>{t("FAQ")}</a>
            <Link
              reloadDocument
              to="/login"
              className="eh-mobile-login"
              onClick={closeMenu}
            >{t("Zaloguj się")}</Link>
          </nav>
          <div className="eh-nav-actions">
            <Link reloadDocument to="/login" className="eh-login-link">{t("Zaloguj się")}</Link>
            <Link reloadDocument to="/register" className="eh-nav-register">{t("Załóż konto")}{" "}<BsArrowUpRight aria-hidden="true" />
            </Link>
            <button
              type="button"
              className="eh-menu-toggle"
              aria-expanded={menuOpen}
              aria-controls="eh-navigation"
              aria-label={menuOpen ? t("Zamknij menu") : t("Otwórz menu")}
              onClick={() => setMenuOpen(!menuOpen)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setMenuOpen(false);
              }}
            >
              {menuOpen ? <BsX /> : <BsList />}
            </button>
          </div>
        </div>
        <div className="eh-container" style={{ display: "flex", justifyContent: "flex-end", paddingBottom: 8 }}>
          <LocaleControls compact />
        </div>
      </header>
      <main id="eh-main">
        <section
          className="eh-hero eh-container"
          aria-labelledby="eh-hero-title"
        >
          <div className="eh-hero-copy">
            <p className="eh-eyebrow">
              <span />{" "}{t("TWOJA DROGA DO PROGRAMOWANIA")}</p>
            <h1 id="eh-hero-title">{t("Naucz się Javy.")}<br />
              <span>{t("Zrób pierwszy krok.")}</span>
            </h1>
            <p className="eh-hero-lead">{t("Od pierwszej linijki kodu do samodzielnych rozwiązań. Poznaj kurs")}{" "}
              <strong>Java Backend Developer</strong>{" "}{t("— uporządkowany plan, praktyczne zadania i naukę we własnym tempie.")}</p>
            <div className="eh-hero-actions">
              <CourseLink />
              <a className="eh-demo-link" href="#wyprobuj">
                <span>
                  <BsPlayFill aria-hidden="true" />
                </span>{t("Wypróbuj zadanie")}</a>
            </div>
            <ul className="eh-hero-promises">
              <li>
                <BsCheck2 aria-hidden="true" />{t("Od podstaw")}</li>
              <li>
                <BsCheck2 aria-hidden="true" />{t("Ćwiczenia z kodem")}</li>
              <li>
                <BsCheck2 aria-hidden="true" />{t("Postęp na koncie")}</li>
            </ul>
            <div className="eh-hero-note">
              <span className="eh-note-line" />
              <p>{t("Przeczytaj. Napisz. Sprawdź.")}<br />
                <strong>{t("Zrozum, dlaczego Twój kod działa.")}</strong>
              </p>
            </div>
          </div>
          <PracticeStudio />
        </section>
        <div
          className="eh-foundations eh-container"
          aria-label={t("Początek programu kursu Java")}
        >
          <span className="eh-foundations-label">{t("SOLIDNY POCZĄTEK")}</span>
          {[
            ["01", "Java i JVM"],
            ["02", "Pierwszy program"],
            ["03", "Git i GitHub"],
            ["04", "Zmienne i typy"],
          ].map(([number, text]) => (
            <span key={number}>
              <small>{number}</small>
              {t(text)}
            </span>
          ))}
        </div>
        <section
          id="kurs-java"
          className="eh-course-section eh-light-section"
          aria-labelledby="eh-course-title"
        >
          <div className="eh-container">
            <div className="eh-section-intro">
              <p className="eh-eyebrow">{t("JEDEN KURS. UPORZĄDKOWANA ŚCIEŻKA.")}</p>
              <div className="eh-section-heading">
                <h2 id="eh-course-title">{t("Twoja nauka Javy")}<br />{t("ma teraz swój kierunek.")}</h2>
                <p>{t("Nie musisz samodzielnie układać kolejności tematów. Zacznij od środowiska pracy, poznaj język i ćwicz to, czego właśnie się uczysz.")}</p>
              </div>
            </div>
            <div className="eh-course-feature">
              <div className="eh-course-details">
                <div className="eh-course-tag">
                  <BsCodeSlash aria-hidden="true" />{" "}{t("KURS ONLINE")}{" "}
                  <span>{t("DLA POCZĄTKUJĄCYCH")}</span>
                </div>
                <h3>
                  Java Backend
                  <br />
                  Developer<span>.</span>
                </h3>
                <p>{t("Pojęcia stają się zrozumiałe, kiedy używasz ich w kodzie. W EduHub przechodzisz od materiału lekcji do własnego rozwiązania i informacji zwrotnej.")}</p>
                <ul className="eh-course-topics">
                  <li>
                    <BsCheckCircleFill aria-hidden="true" />{" "}{t("JDK, JVM i konfiguracja środowiska")}</li>
                  <li>
                    <BsCheckCircleFill aria-hidden="true" />{" "}{t("Pierwszy program i praca w IntelliJ IDEA")}</li>
                  <li>
                    <BsCheckCircleFill aria-hidden="true" />{" "}{t("Zmienne, typy danych i operatory")}</li>
                  <li>
                    <BsCheckCircleFill aria-hidden="true" />{" "}{t("Git, GitHub i czytelny kod")}</li>
                </ul>
                <Link
                  reloadDocument
                  className="eh-inline-link"
                  to={JAVA_COURSE_PATH}
                >{t("Zobacz program kursu")}{" "}<BsArrowRight aria-hidden="true" />
                </Link>
              </div>
              <JavaOffer />
            </div>
          </div>
        </section>
        <section
          id="metoda"
          className="eh-section eh-container"
          aria-labelledby="eh-method-title"
        >
          <div className="eh-section-intro">
            <p className="eh-eyebrow">{t("MAŁE KROKI. KONKRETNA PRAKTYKA.")}</p>
            <div className="eh-section-heading">
              <h2 id="eh-method-title">{t("Uczysz się.")}<br />{t("Od razu sprawdzasz.")}</h2>
              <p>{t("Każda kolejna rzecz ma swoje miejsce. Wracasz do materiału, poprawiasz rozwiązanie i budujesz samodzielność.")}</p>
            </div>
          </div>
          <ol className="eh-method-steps">
            {[
              [
                "01",
                "Zrozum temat",
                "Poznaj pojęcie, zobacz przykład i sprawdź, co dzieje się w kodzie.",
                BsBook,
              ],
              [
                "02",
                "Napisz rozwiązanie",
                "Przećwicz poznany materiał w zadaniu. Zamiast przeskakiwać dalej, spróbuj samodzielnie.",
                BsCodeSlash,
              ],
              [
                "03",
                "Sprawdź i popraw",
                "W zadaniach ocenianych automatycznie otrzymasz wynik i wskazówki do poprawy.",
                BsTerminal,
              ],
              [
                "04",
                "Zobacz swój postęp",
                "Na koncie wrócisz do lekcji i sprawdzisz, które elementy kursu masz już za sobą.",
                BsLayers,
              ],
            ].map(([number, title, text, Icon]) => (
              <li key={number}>
                <div className="eh-step-top">
                  <span>{number}</span>
                  <Icon aria-hidden="true" />
                </div>
                <h3>{t(title)}</h3>
                <p>{t(text)}</p>
              </li>
            ))}
          </ol>
          <div className="eh-learning-note">
            <BsBook aria-hidden="true" />
            <p>
              <strong>{t("Twoje tempo jest w porządku.")}</strong>{" "}{t("Materiały przeglądasz wtedy, kiedy masz przestrzeń na naukę. Wróć do trudniejszego tematu i przejdź dalej, gdy go zrozumiesz.")}</p>
            <a href="#wyprobuj" className="eh-inline-link">{t("Sprawdź przykład")}{" "}<BsArrowRight aria-hidden="true" />
            </a>
          </div>
        </section>
        <section
          id="sciezki"
          className="eh-section eh-paths-section"
          aria-labelledby="eh-paths-title"
        >
          <div className="eh-container">
            <div className="eh-section-intro">
              <p className="eh-eyebrow">{t("WYBIERZ SWÓJ CEL")}</p>
              <div className="eh-section-heading">
                <h2 id="eh-paths-title">{t("Programowanie?")}<br />{t("A może egzamin?")}</h2>
                <p>{t("Kurs Java to główna ścieżka EduHub. Jeśli uczysz się w technikum, sprawdź też materiały i przygotowanie do kwalifikacji zawodowych.")}</p>
              </div>
            </div>
            <div
              className="eh-path-filters"
              role="group"
              aria-label={t("Filtruj ścieżki nauki")}
            >
              {[
                ["all", "Wszystkie ścieżki"],
                ["programming", "Programowanie"],
                ["exams", "Egzaminy zawodowe"],
              ].map(([id, label]) => (
                <button
                  type="button"
                  key={id}
                  aria-pressed={pathFilter === id}
                  onClick={() => setPathFilter(id)}
                >
                  {t(label)}
                </button>
              ))}
            </div>
            <div className="eh-path-grid" aria-live="polite">
              {paths.map((path) => (
                <article
                  key={path.id}
                  className={"eh-path-card eh-path-" + path.id}
                >
                  <div className="eh-path-visual" aria-hidden="true">
                    <span>{path.symbol}</span>
                    <span className="eh-path-visual-label">
                      {path.visualLabel}
                    </span>
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="eh-path-body">
                    <p className="eh-path-type">{t(path.type)}</p>
                    <h3>{path.title}</h3>
                    <p>{t(path.description)}</p>
                    <ul>
                      {path.tags.map((tag) => (
                        <li key={tag}>{t(tag)}</li>
                      ))}
                    </ul>
                    <Link
                      reloadDocument
                      className="eh-path-link"
                      to={path.href}
                    >
                      {t(path.cta)}
                      <BsArrowUpRight aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            <p className="eh-path-note">{t("Program i ceny kursu Java są publiczne. Pozostałe materiały i warunki dostępu sprawdzisz po zalogowaniu na platformę.")}</p>
          </div>
        </section>
        <section
          id="korepetycje"
          className="eh-section eh-container"
          aria-labelledby="eh-tutoring-title"
        >
          <div className="eh-tutoring">
            <div className="eh-tutoring-copy">
              <p className="eh-eyebrow">{t("CZASEM WYSTARCZY DOBRE WYJAŚNIENIE")}</p>
              <h2 id="eh-tutoring-title">{t("Utknąłeś w zadaniu?")}<br />{t("Przejdźmy przez nie razem.")}</h2>
              <p>{t("Indywidualne korepetycje online z informatyki i programowania. Przyjdź z pytaniem z Javy, SQL, zadaniem szkolnym albo tematem do egzaminu.")}</p>
              <Link
                reloadDocument
                to="/tutoring-booking"
                className="eh-button eh-button-primary"
              >{t("Sprawdź dostępne terminy")}{" "}<BsCalendarCheck aria-hidden="true" />
              </Link>
              <span className="eh-tutoring-note">{t("Temat i termin wybierzesz na stronie rezerwacji.")}</span>
            </div>
            <div className="eh-session-plan">
              <div className="eh-session-heading">
                <BsCalendarCheck aria-hidden="true" />
                <span>{t("Jak wygląda rezerwacja")}</span>
                <span>1:1</span>
              </div>
              <ol>
                <li>
                  <span>01</span>
                  <div>
                    <h3>{t("Znajdź swój termin")}</h3>
                    <p>{t("Zobacz dostępne godziny w kalendarzu.")}</p>
                  </div>
                </li>
                <li>
                  <span>02</span>
                  <div>
                    <h3>{t("Opisz, nad czym pracujesz")}</h3>
                    <p>{t("Podaj temat, zadanie lub zagadnienie do wyjaśnienia.")}</p>
                  </div>
                </li>
                <li>
                  <span>03</span>
                  <div>
                    <h3>{t("Przygotuj się do spotkania")}</h3>
                    <p>{t("Dokończ rezerwację zgodnie z instrukcjami.")}</p>
                  </div>
                </li>
              </ol>
              <p>
                <BsCodeSlash aria-hidden="true" />{" "}{t("Java · SQL · INF.02 · INF.03 · INF.04")}</p>
            </div>
          </div>
        </section>
        <section
          className="eh-creator-section eh-container"
          aria-labelledby="eh-creator-title"
        >
          <div className="eh-creator-mark" aria-hidden="true">
            JM<span>&lt;/&gt;</span>
          </div>
          <div>
            <p className="eh-eyebrow">{t("AUTORSKA PLATFORMA EDUKACYJNA")}</p>
            <h2 id="eh-creator-title">{t("Zbudowana z myślą o praktyce.")}</h2>
            <p>{t("EduHub to projekt Jakuba Marcinkowskiego — miejsce łączące materiały do nauki, zadania i własną platformę. Chcesz poznać twórcę lub zobaczyć inne projekty?")}</p>
          </div>
          <a
            className="eh-inline-link"
            href="https://kui3us.github.io/portfolio/"
            target="_blank"
            rel="noopener noreferrer"
          >{t("Poznaj twórcę")}{" "}<BsArrowUpRight aria-hidden="true" />
          </a>
        </section>
        <section
          id="faq"
          className="eh-section eh-light-section"
          aria-labelledby="eh-faq-title"
        >
          <div className="eh-container eh-faq-layout">
            <div className="eh-faq-intro">
              <p className="eh-eyebrow">{t("DOBRZE WIEDZIEĆ NA START")}</p>
              <h2 id="eh-faq-title">{t("Masz pytania?")}<br />{t("Zacznij tutaj.")}</h2>
              <p>{t("Najważniejsze informacje o kursie, koncie i sposobie nauki.")}</p>
              <CourseLink secondary>{t("Sprawdź pełną ofertę Javy")}</CourseLink>
            </div>
            <div className="eh-faq-list">
              {HOME_FAQ.map((item) => (
                <details key={item.question}>
                  <summary>
                    {t(item.question)}
                    <span aria-hidden="true">+</span>
                  </summary>
                  <p>{t(item.answer)}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section
          className="eh-final-section eh-container"
          aria-labelledby="eh-final-title"
        >
          <p className="eh-eyebrow">
            <span />{" "}{t("TERAZ TWÓJ RUCH")}</p>
          <h2 id="eh-final-title">{t("Pierwsza linijka kodu.")}<br />
            <span>{t("Twój kolejny krok.")}</span>
          </h2>
          <p>{t("Zobacz program, spróbuj ćwiczenia i zdecyduj, jak chcesz się uczyć.")}</p>
          <div>
            <CourseLink>{t("Poznaj Java Backend Developer")}</CourseLink>
            <Link reloadDocument to="/register" className="eh-inline-link">{t("Załóż konto w EduHub")}{" "}<BsArrowRight aria-hidden="true" />
            </Link>
          </div>
          <a className="eh-back-top" href="#start">{t("Wróć na górę")}{" "}<BsArrowDown aria-hidden="true" />
          </a>
        </section>
      </main>
      <footer className="eh-footer">
        <div className="eh-container">
          <div className="eh-footer-top">
            <div className="eh-footer-brand">
              <Brand footer />
              <p>{t("Programowanie zaczyna się od zrozumienia.")}<br />{t("Ucz się. Próbuj. Twórz.")}</p>
            </div>
            <div>
              <h2>{t("Nauka")}</h2>
              <Link reloadDocument to={JAVA_COURSE_PATH}>{t("Kurs Java Backend Developer")}</Link>
              <a href="#sciezki">{t("Egzaminy zawodowe")}</a>
              <a href="#metoda">{t("Jak działa EduHub")}</a>
              <a href="#wyprobuj">{t("Wypróbuj zadanie")}</a>
            </div>
            <div>
              <h2>EduHub</h2>
              <Link reloadDocument to="/login">{t("Logowanie")}</Link>
              <Link reloadDocument to="/register">{t("Załóż konto")}</Link>
              <Link reloadDocument to="/tutoring-booking">{t("Korepetycje online")}</Link>
              <a href="#faq">{t("Pytania i odpowiedzi")}</a>
              <Link reloadDocument to="/pomoc">{t("Pomoc i kontakt")}</Link>
            </div>
            <div>
              <h2>{t("Poznaj twórcę")}</h2>
              <a
                href="https://kui3us.github.io/portfolio/"
                target="_blank"
                rel="noopener noreferrer"
              >{t("Portfolio")}{" "}<BsArrowUpRight aria-hidden="true" />
              </a>
              <a
                href="https://github.com/KuI3uS"
                target="_blank"
                rel="noopener noreferrer"
              >
                <BsGithub aria-hidden="true" /> GitHub
              </a>
              <a
                href="https://linkedin.com/in/jakubmarcinkowski"
                target="_blank"
                rel="noopener noreferrer"
              >
                <BsLinkedin aria-hidden="true" /> LinkedIn
              </a>
            </div>
          </div>
          <div className="eh-footer-bottom">
            <span>
              © {new Date().getFullYear()}{" "}{t("EduHub. Wszystkie prawa zastrzeżone.")}</span>
            <span>{t("Java · Praktyka · Rozwój")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

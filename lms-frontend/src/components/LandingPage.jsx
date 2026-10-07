import { Link } from "react-router-dom";
import {
    BsBook,
    BsCodeSlash,
    BsDatabase,
    BsDiagram3,
    BsGithub,
    BsLinkedin,
    BsMortarboard,
    BsRocketTakeoff,
    BsShieldCheck,
    BsTerminal,
    BsCalendarCheck,
} from "react-icons/bs";

import "../styles/landing.css";

export default function LandingPage() {
    return (
        <div className="landing-page">
            <nav>
                <a href="#home">Home</a>
                <a href="#courses">Kursy</a>
                <a href="#how">Jak działa</a>
                <a href="https://kui3us.github.io/portfolio/">Portfolio</a>
                <a href="/tutoring-booking">Korepetycje</a>
                <Link to="/login">Logowanie</Link>
                <Link to="/register">Rejestracja</Link>
            </nav>

            <header id="home" className="hero">
                <div className="hero-content">
                    <h1>
                        Nauka INF.02, INF.03 i INF.04<br />
                        w nowoczesnej platformie <span className="accent">EduHub</span>
                    </h1>

                    <p className="hero-subtitle">
                        Kursy programowania, backendu, baz danych, systemów operacyjnych
                        i przygotowania do egzaminów zawodowych.
                    </p>

                    <div className="hero-badges">
                        <span className="badge">INF.02</span>
                        <span className="badge">INF.03</span>
                        <span className="badge">INF.04</span>
                        <span className="badge">Java</span>
                        <span className="badge">Spring Boot</span>
                        <span className="badge">SQL</span>
                    </div>
                </div>
            </header>

            <main>
                <section id="courses" className="section">
                    <div className="container">
                        <h2 className="section-title">Dostępne ścieżki nauki</h2>

                        <div className="grid-projects">
                            <div className="project-tile">
                                <div className="project-content">
                                    <BsTerminal size={32} className="accent" />
                                    <h3>INF.02</h3>
                                    <p>
                                        Systemy operacyjne, Linux, sieci komputerowe,
                                        administracja i podstawy infrastruktury IT.
                                    </p>
                                </div>
                            </div>

                            <div className="project-tile">
                                <div className="project-content">
                                    <BsCodeSlash size={32} className="accent" />
                                    <h3>INF.03</h3>
                                    <p>
                                        Programowanie, Java, backend, Spring Boot,
                                        REST API, Git i praca z bazą danych.
                                    </p>
                                </div>
                            </div>

                            <div className="project-tile">
                                <div className="project-content">
                                    <BsDiagram3 size={32} className="accent" />
                                    <h3>INF.04</h3>
                                    <p>
                                        Aplikacje internetowe, frontend, JavaScript,
                                        projektowanie UI i nowoczesny web development.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>



                <section id="how" className="section">
                    <div className="container">
                        <h2 className="section-title">Jak działa EduHub?</h2>

                        <div className="roles-grid">
                            <div className="card">
                                <BsBook size={30} className="accent" />
                                <h3>1. Wybierasz kurs</h3>
                                <p>
                                    Uczeń wybiera ścieżkę: INF.02, INF.03, INF.04
                                    albo osobny kurs programowania.
                                </p>
                            </div>

                            <div className="card">
                                <BsMortarboard size={30} className="accent" />
                                <h3>2. Uczysz się krok po kroku</h3>
                                <p>
                                    Lekcje mogą odblokowywać się po kolei,
                                    dzięki czemu nauka ma logiczną kolejność.
                                </p>
                            </div>

                            <div className="card">
                                <BsCodeSlash size={30} className="accent" />
                                <h3>3. Rozwiązujesz zadania</h3>
                                <p>
                                    Zadania tekstowe i kodowe pozwalają ćwiczyć praktykę,
                                    nie tylko czytać teorię.
                                </p>
                            </div>

                            <div className="card">
                                <BsShieldCheck size={30} className="accent" />
                                <h3>4. Śledzisz progres</h3>
                                <p>
                                    System zapisuje ukończone lekcje, prace ucznia,
                                    wyniki i komentarze nauczyciela.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="tutoring" className="section">
                    <div className="container card card--featured">
                        <span className="featured-label">KOREPETYCJE ONLINE</span>

                        <h2>Zarezerwuj korepetycje z informatyki</h2>

                        <p className="featured-intro">
                            Możesz umówić się na indywidualne zajęcia z INF.02, INF.03,
                            INF.04, Javy, SQL, Spring Boot lub przygotowania do egzaminu.
                        </p>

                        <div className="featured-grid">
                            <div className="featured-text">
                                <h3>Jak to działa?</h3>
                                <ul>
                                    <li>wybierasz dostępny termin z kalendarza,</li>
                                    <li>podajesz temat zajęć,</li>
                                    <li>rezerwujesz termin,</li>
                                    <li>po akceptacji otrzymujesz link do spotkania.</li>
                                </ul>

                                <h3>Tematy zajęć</h3>
                                <ul>
                                    <li>INF.02 — systemy, sieci, Linux, administracja,</li>
                                    <li>INF.03 — programowanie, Java, SQL, backend,</li>
                                    <li>INF.04 — web, JavaScript, aplikacje internetowe,</li>
                                    <li>projekty szkolne i przygotowanie do egzaminu.</li>
                                </ul>

                                <div className="featured-cta">
                                    <Link to="/tutoring-booking" className="btn-outline">
                                        Zarezerwuj termin
                                    </Link>
                                </div>
                            </div>

                            <div className="architecture-diagram card">
                                <div>
                                    <BsCalendarCheck size={52} className="accent" />
                                    <p>
                                        Kalendarz → Termin → Rezerwacja → Spotkanie online
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="section">
                    <div className="container card card--featured">
                        <span className="featured-label">EDUHUB PLATFORM</span>

                        <h2>Platforma edukacyjna dla technika informatyka</h2>

                        <p className="featured-intro">
                            EduHub łączy teorię, zadania praktyczne, kursy zawodowe
                            i panel ucznia w jednym miejscu. Celem jest nauka przez praktykę,
                            a nie tylko bierne czytanie materiałów.
                        </p>

                        <div className="featured-grid">
                            <div className="featured-text">
                                <h3>Co zawiera platforma?</h3>
                                <ul>
                                    <li>Kursy pod INF.02, INF.03 i INF.04</li>
                                    <li>Lekcje z teorią, przykładami i obrazami</li>
                                    <li>Zadania kodowe ze starter code</li>
                                    <li>Blokowanie lekcji krok po kroku</li>
                                    <li>Panel ucznia i panel administratora</li>
                                    <li>Wysyłanie prac do sprawdzenia</li>
                                </ul>

                                <h3>Dla kogo?</h3>
                                <p>
                                    Dla uczniów technikum informatycznego, osób przygotowujących się
                                    do egzaminów zawodowych oraz początkujących programistów.
                                </p>

                                <div className="featured-cta">
                                    <Link to="/register" className="btn-outline">
                                        Załóż konto
                                    </Link>
                                    <Link to="/login" className="btn-ghost">
                                        Przejdź do platformy
                                    </Link>
                                </div>
                            </div>

                            <div className="architecture-diagram card">
                                <div>
                                    <BsRocketTakeoff size={52} className="accent" />
                                    <p>
                                        Kursy → Moduły → Lekcje → Zadania → Progres
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="portfolio" className="section">
                    <div className="container">
                        <h2 className="section-title">O twórcy platformy</h2>

                        <div className="roles-grid">
                            <div className="card">
                                <BsCodeSlash size={30} className="accent" />
                                <h3>Backend</h3>
                                <ul>
                                    <li>Java / Spring Boot</li>
                                    <li>REST API</li>
                                    <li>JWT Security</li>
                                    <li>JPA / Hibernate</li>
                                </ul>
                            </div>

                            <div className="card">
                                <BsDatabase size={30} className="accent" />
                                <h3>Dane i bazy</h3>
                                <ul>
                                    <li>SQL / MySQL</li>
                                    <li>Relacje encji</li>
                                    <li>Raporty i analiza danych</li>
                                    <li>Integracje backendowe</li>
                                </ul>
                            </div>

                            <div className="card">
                                <BsDiagram3 size={30} className="accent" />
                                <h3>Systemy</h3>
                                <ul>
                                    <li>Docker</li>
                                    <li>CI/CD</li>
                                    <li>Render / Vercel</li>
                                    <li>Architektura end-to-end</li>
                                </ul>
                            </div>

                            <div className="card">
                                <BsMortarboard size={30} className="accent" />
                                <h3>Edukacja</h3>
                                <ul>
                                    <li>Informatyka</li>
                                    <li>Aplikacje internetowe</li>
                                    <li>Java Developer</li>
                                    <li>Projekty produkcyjne</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <footer>
                <p>
                    © 2025 Jakub Marcinkowski ·
                    <a href="https://github.com/KuI3uS" target="_blank"><i className="fab fa-github"></i></a> ·
                    <a href="https://linkedin.com/in/jakubmarcinkowski" target="_blank"><i
                        className="fab fa-linkedin"></i></a>
                </p>
            </footer>
        </div>
    );
}
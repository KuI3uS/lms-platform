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
} from "react-icons/bs";

import "../styles/landing.css";

export default function LandingPage() {
    return (
        <div className="landing-page">
            <nav>
                <a href="#home">Home</a>
                <a href="#courses">Kursy</a>
                <a href="#how">Jak działa</a>
                <a href="#portfolio">Portfolio</a>
                <a href="#contact">Kontakt</a>
                <Link to="/login">Logowanie</Link>
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

                    <div className="hero-scroll">
                        <Link to="/register" className="btn-outline">
                            Rozpocznij naukę
                        </Link>

                        <Link to="/login" className="btn-ghost">
                            Zaloguj się
                        </Link>
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
                                    <Link to="/register" className="btn-outline">
                                        Rozpocznij
                                    </Link>
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
                                    <Link to="/register" className="btn-outline">
                                        Rozpocznij
                                    </Link>
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
                                    <Link to="/register" className="btn-outline">
                                        Rozpocznij
                                    </Link>
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

                <section id="projects" className="section">
                    <div className="container">
                        <h2 className="section-title">Wybrane projekty</h2>

                        <div className="grid-projects">
                            <div className="project-tile">
                                <img src="/image/img_1.png" alt="System predykcji awarii" />
                                <div className="project-content">
                                    <h3>System predykcji awarii</h3>
                                    <p>
                                        <strong>Java, Spring Boot, Angular, Python, SQL, Docker</strong>
                                    </p>
                                    <p>
                                        Projekt inżynierski do analizy i przewidywania incydentów IT.
                                    </p>
                                    <a
                                        href="https://github.com/PJAID/PJAID"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn-outline"
                                    >
                                        Repozytorium
                                    </a>
                                </div>
                            </div>

                            <div className="project-tile">
                                <img src="/image/img_2.png" alt="Trening App" />
                                <div className="project-content">
                                    <h3>Trening App iOS</h3>
                                    <p>
                                        <strong>Swift, CoreData, Firebase</strong>
                                    </p>
                                    <p>
                                        Aplikacja do śledzenia progresu treningowego.
                                    </p>
                                    <a
                                        href="https://github.com/KuI3uS/IronTrack"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn-outline"
                                    >
                                        Repozytorium
                                    </a>
                                </div>
                            </div>

                            <div className="project-tile">
                                <img src="/image/img_3.png" alt="Quiz App" />
                                <div className="project-content">
                                    <h3>Quiz App BIU</h3>
                                    <p>
                                        <strong>JavaScript, SCSS, HTML</strong>
                                    </p>
                                    <p>
                                        Dynamiczna aplikacja quizowa z interaktywnym UX.
                                    </p>
                                    <a
                                        href="https://quiz-app-biu.netlify.app"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn-outline"
                                    >
                                        Zobacz aplikację
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="contact" className="section">
                    <div className="container">
                        <h2 className="section-title">Rozpocznij naukę</h2>

                        <p>
                            EduHub rozwija się jako platforma do nauki informatyki,
                            programowania i przygotowania do egzaminów zawodowych.
                        </p>

                        <div className="contact-cta">
                            <Link to="/register" className="btn-outline">
                                Załóż konto
                            </Link>

                            <Link to="/login" className="btn-ghost">
                                Zaloguj się
                            </Link>

                            <a
                                href="https://github.com/KuI3uS"
                                target="_blank"
                                rel="noreferrer"
                                className="btn-ghost"
                            >
                                <BsGithub /> GitHub
                            </a>

                            <a
                                href="https://linkedin.com/in/jakubmarcinkowski"
                                target="_blank"
                                rel="noreferrer"
                                className="btn-ghost"
                            >
                                <BsLinkedin /> LinkedIn
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <footer>
                <p>
                    © 2026 Jakub Marcinkowski · EduHub
                </p>
            </footer>
        </div>
    );
}
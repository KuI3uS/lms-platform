import { JAVA_COURSE_PATH } from "./javaCourseOffer.js";

export const SITE_URL = "https://edu-hub.com.pl";
export const JAVA_COURSE_URL = `${SITE_URL}${JAVA_COURSE_PATH}`;
export const JAVA_COURSE_TITLE = "Kurs Java online od podstaw – Java Backend Developer | EduHub";
export const JAVA_COURSE_META_DESCRIPTION = "Kurs Java online dla początkujących. Poznaj Java Backend Developer w EduHub: ćwiczenia z kodem, nauka we własnym tempie, program i aktualna cena bez logowania.";

// Topics verified against the public course outline. Prices and lesson counts
// stay in the live offer, so a build never freezes commercial information.
export const JAVA_COURSE_TOPICS = [
    { title: "Środowisko Java i pierwsze uruchomienie", description: "Dowiedz się, czym różnią się JDK, JVM i JRE. Początek programu obejmuje instalację Javy, konfigurację IntelliJ IDEA i uruchomienie pierwszego projektu." },
    { title: "Pierwszy program i praca z kodem", description: "Poznaj metodę main i System.out.println. Zobacz, jak kod źródłowy zmienia się w bytecode oraz jaką rolę odgrywa JVM. Zacznij korzystać z Gita i GitHuba." },
    { title: "Zmienne i podstawowe typy danych", description: "Pracuj z typami int, long, double, boolean i char. Poznaj literały, zasady nazewnictwa oraz konwersje typów i casting, aby pisać czytelne instrukcje." },
    { title: "Wprowadzanie danych i operatory", description: "Poznaj Scanner oraz operatory arytmetyczne, porównania i logiczne. Ćwicz odczytywanie danych, wykonywanie obliczeń i rozumienie wyniku programu." }
];

export function getJavaCourseStructuredData() {
    return {
        "@context": "https://schema.org",
        "@graph": [
            { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "EduHub", url: `${SITE_URL}/` },
            { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: "EduHub", url: `${SITE_URL}/`, inLanguage: "pl", publisher: { "@id": `${SITE_URL}/#organization` } },
            {
                "@type": "WebPage", "@id": `${JAVA_COURSE_URL}#webpage`, url: JAVA_COURSE_URL,
                name: JAVA_COURSE_TITLE, description: JAVA_COURSE_META_DESCRIPTION, inLanguage: "pl",
                isPartOf: { "@id": `${SITE_URL}/#website` }, mainEntity: { "@id": `${JAVA_COURSE_URL}#course` },
                breadcrumb: { "@id": `${JAVA_COURSE_URL}#breadcrumb` }
            },
            {
                "@type": "Course", "@id": `${JAVA_COURSE_URL}#course`, url: JAVA_COURSE_URL,
                name: "Java Backend Developer", description: JAVA_COURSE_META_DESCRIPTION,
                image: `${SITE_URL}/images/course-covers/java.png`, inLanguage: "pl",
                educationalLevel: "Początkujący", teaches: JAVA_COURSE_TOPICS.map(topic => topic.title),
                provider: { "@id": `${SITE_URL}/#organization` }
            },
            {
                "@type": "BreadcrumbList", "@id": `${JAVA_COURSE_URL}#breadcrumb`, itemListElement: [
                    { "@type": "ListItem", position: 1, name: "EduHub", item: `${SITE_URL}/` },
                    { "@type": "ListItem", position: 2, name: "Kurs Java Backend Developer", item: JAVA_COURSE_URL }
                ]
            }
        ]
    };
}

export function serializeStructuredData(data) {
    return JSON.stringify(data).replace(/</g, "\\u003c");
}

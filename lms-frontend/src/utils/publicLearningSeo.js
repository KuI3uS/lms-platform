import { PYTHON_COURSE_NAME, PYTHON_COURSE_PATH } from "./pythonCourseOffer.js";
import { INF03_PATH } from "./inf03Practice.js";
import { SITE_URL } from "./javaCourseSeo.js";

export const PYTHON_PAGE_TITLE = "Kurs Python + AI — automatyzacje dla biznesu | EduHub";
export const PYTHON_PAGE_DESCRIPTION = "Poznaj kurs Python + AI: automatyzacje dla biznesu od podstaw. Sprawdź plan nauki, aktualną cenę i zasady dostępu. Materiały po polsku, nauka we własnym tempie.";
export const INF03_PAGE_TITLE = "Testy INF.03 online z wyjaśnieniami — bez logowania | EduHub";
export const INF03_PAGE_DESCRIPTION = "Rozwiąż darmowy test INF.03: HTML, CSS, JavaScript, PHP i SQL. 6 autorskich pytań online z odpowiedziami i wyjaśnieniami, bez konta i limitu czasu.";

function publicPageGraph(path, title, description, resource) {
    const url = SITE_URL + path;
    return { "@context": "https://schema.org", "@graph": [
        { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "EduHub", url: SITE_URL + "/" },
        { "@type": "WebPage", "@id": url + "#webpage", url, name: title, description, inLanguage: "pl",
            mainEntity: { "@id": url + "#resource" }, breadcrumb: { "@id": url + "#breadcrumb" } },
        { "@id": url + "#resource", url, inLanguage: "pl", ...resource },
        { "@type": "BreadcrumbList", "@id": url + "#breadcrumb", itemListElement: [
            { "@type": "ListItem", position: 1, name: "EduHub", item: SITE_URL + "/" },
            { "@type": "ListItem", position: 2, name: resource.name, item: url },
        ] },
    ] };
}

// Do not freeze prices, availability or planned/published lesson counts at build
// time. These are fetched from the live offer; no invented reviews or ratings.
export const getPythonCourseStructuredData = () => publicPageGraph(PYTHON_COURSE_PATH, PYTHON_PAGE_TITLE, PYTHON_PAGE_DESCRIPTION, {
    "@type": "Course", name: PYTHON_COURSE_NAME, description: PYTHON_PAGE_DESCRIPTION,
    provider: { "@id": `${SITE_URL}/#organization` }, educationalLevel: "Początkujący",
});
export const getInf03StructuredData = () => publicPageGraph(INF03_PATH, INF03_PAGE_TITLE, INF03_PAGE_DESCRIPTION, {
    "@type": "LearningResource", name: "Testy INF.03 — autorskie pytania treningowe", description: INF03_PAGE_DESCRIPTION,
    learningResourceType: "Practice test", isAccessibleForFree: true,
    author: { "@type": "Person", name: "Jakub Marcinkowski" },
});

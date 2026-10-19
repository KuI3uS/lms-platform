import { SITE_URL } from "./javaCourseSeo.js";

export const HOME_TITLE =
  "EduHub — kurs Java online od podstaw i nauka programowania";
export const HOME_DESCRIPTION =
  "Poznaj kurs Java Backend Developer. Ucz się Javy krok po kroku, rozwiązuj zadania i śledź postęp. Wypróbuj ćwiczenie bez konta. Egzaminy INF i korepetycje.";

export function getHomeStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": SITE_URL + "/#organization",
        name: "EduHub",
        url: SITE_URL + "/",
      },
      {
        "@type": "WebSite",
        "@id": SITE_URL + "/#website",
        name: "EduHub",
        url: SITE_URL + "/",
        inLanguage: "pl",
        publisher: { "@id": SITE_URL + "/#organization" },
      },
      {
        "@type": "WebPage",
        "@id": SITE_URL + "/#webpage",
        name: HOME_TITLE,
        description: HOME_DESCRIPTION,
        url: SITE_URL + "/",
        inLanguage: "pl",
        isPartOf: { "@id": SITE_URL + "/#website" },
        about: { "@id": SITE_URL + "/kurs/java-backend-developer#course" },
      },
    ],
  };
}

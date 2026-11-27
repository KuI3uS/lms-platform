import { SITE_URL } from "./javaCourseSeo.js";

export const HOME_TITLE =
  "EduHub — kursy programowania, Python + AI i testy INF.03";
export const HOME_DESCRIPTION =
  "Kursy Java oraz Python + AI — automatyzacje dla biznesu. Darmowy test INF.03 z wyjaśnieniami. Sprawdź programy kursów, ucz się we własnym tempie i ćwicz w EduHub.";

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
        about: [
          { "@id": SITE_URL + "/kurs/java-backend-developer#course" },
          { "@id": SITE_URL + "/kurs/python-ai-automatyzacje-dla-biznesu#resource" },
          { "@id": SITE_URL + "/egzaminy/inf-03#resource" },
        ],
      },
    ],
  };
}

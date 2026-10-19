import { JAVA_COURSE_PATH } from "./javaCourseOffer.js";

export const PRACTICE_EXAMPLES = [
  {
    id: "java",
    label: "Java · pierwszy program",
    file: "Main.java",
    code: [
      'String jezyk = "Java";',
      'String wiadomosc = "Cześć, " + jezyk;',
      "",
      "System.out.println(wiadomosc);",
    ].join("\n"),
    question: "Co wypisze ten program?",
    placeholder: "Wpisz wynik programu",
    answers: ["Cześć, Java"],
    caseSensitive: true,
    hint: "Sprawdź, jaki tekst zawiera zmienna jezyk. Operator + połączy go z tekstem Cześć, oraz spacją.",
    explanation:
      "Dokładnie! Operator + połączył dwa teksty. Wynik to: Cześć, Java.",
  },
  {
    id: "sql",
    label: "SQL · wybór danych",
    file: "zapytanie.sql",
    code: ["SELECT imie", "FROM uczniowie", "WHERE aktywny = 1;"].join("\n"),
    question: "Jaka kolumna zostanie wybrana?",
    placeholder: "Wpisz nazwę kolumny",
    answers: ["imie"],
    caseSensitive: false,
    hint: "Spójrz na nazwę po SELECT. FROM wskazuje tabelę, a WHERE filtruje wiersze.",
    explanation:
      "Dobrze! SELECT imie wybiera kolumnę imie. Warunek WHERE ogranicza wynik do aktywnych uczniów.",
  },
];

function normalizeAnswer(answer) {
  let text = String(answer ?? "")
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ");
  const quotePairs = [
    ['"', '"'],
    ["'", "'"],
    ["„", "”"],
    ["“", "”"],
  ];
  if (
    quotePairs.some(
      ([left, right]) => text.startsWith(left) && text.endsWith(right),
    )
  )
    text = text.slice(1, -1).trim();
  return text;
}

export function checkPracticeAnswer(id, answer) {
  const normalized = normalizeAnswer(answer);
  if (!normalized) return "empty";
  const example = PRACTICE_EXAMPLES.find((item) => item.id === id);
  if (!example) return "retry";
  const compare = (value) =>
    example.caseSensitive ? value : value.toLocaleLowerCase("pl-PL");
  return example.answers.some((value) => compare(value) === compare(normalized))
    ? "correct"
    : "retry";
}

export const LEARNING_PATHS = [
  {
    id: "java",
    category: "programming",
    symbol: "Java",
    visualLabel: "Main.java",
    type: "KURS ONLINE · OD PODSTAW",
    title: "Java Backend Developer",
    description:
      "Zacznij od środowiska pracy i pierwszego programu. Poznawaj Javę, rozwiązuj ćwiczenia i buduj własne rozwiązania.",
    tags: ["Java", "Git", "Praktyka"],
    href: JAVA_COURSE_PATH,
    cta: "Poznaj program kursu",
  },
  {
    id: "inf02",
    category: "exams",
    symbol: ">_",
    visualLabel: "INF.02",
    type: "KWALIFIKACJA ZAWODOWA",
    title: "INF.02",
    description:
      "Administracja i eksploatacja systemów komputerowych, urządzeń peryferyjnych i lokalnych sieci komputerowych.",
    tags: ["Systemy", "Sieci", "Administracja"],
    href: "/courses",
    cta: "Zobacz na platformie",
  },
  {
    id: "inf03",
    category: "exams",
    symbol: "</>",
    visualLabel: "INF.03",
    type: "KWALIFIKACJA ZAWODOWA",
    title: "INF.03",
    description:
      "Tworzenie i administrowanie stronami i aplikacjami internetowymi oraz bazami danych.",
    tags: ["HTML i CSS", "JavaScript", "Bazy danych"],
    href: "/courses",
    cta: "Zobacz na platformie",
  },
  {
    id: "inf04",
    category: "exams",
    symbol: "{ }",
    visualLabel: "INF.04",
    type: "KWALIFIKACJA ZAWODOWA",
    title: "INF.04",
    description:
      "Projektowanie, programowanie i testowanie aplikacji. Praca z algorytmami, kodem i sprawdzaniem rozwiązań.",
    tags: ["Aplikacje", "Algorytmy", "Testowanie"],
    href: "/courses",
    cta: "Zobacz na platformie",
  },
];

export const HOME_FAQ = [
  {
    question: "Czy mogę zacząć naukę Javy bez doświadczenia?",
    answer:
      "Tak. Początek kursu Java Backend Developer obejmuje wyjaśnienie, jak działa Java, przygotowanie środowiska i pierwszy program. Potem przechodzisz do zmiennych, typów danych i kolejnych zagadnień.",
  },
  {
    question: "Czy mogę spróbować przed założeniem konta?",
    answer:
      "Tak. Na początku tej strony znajdziesz krótkie przykładowe zadania z Javy i SQL. Nie wymagają logowania, a ich wyniki nie są zapisywane na koncie. Program i ofertę kursu Java również możesz sprawdzić bez konta.",
  },
  {
    question: "Ile kosztuje kurs Java Backend Developer?",
    answer:
      "Aktualne warianty i ceny zobaczysz w sekcji kursu oraz na jego publicznej stronie. Przed zakupem sprawdzisz wybrany wariant i zasady dostępu. Abonament miesięczny odnawia się automatycznie; dostęp bezterminowy jest osobną opcją, jeśli jest dostępny w ofercie.",
  },
  {
    question: "Czy samo założenie konta oznacza płatność?",
    answer:
      "Założenie konta nie uruchamia płatności. Dostęp do konkretnego kursu zależy od jego oferty i Twoich uprawnień. Warunki wybranego wariantu sprawdzisz przed potwierdzeniem zakupu.",
  },
  {
    question: "Czy cały program kursu jest już udostępniony?",
    answer:
      "Materiały są udostępniane etapami. Program przedstawia ścieżkę nauki, a po uzyskaniu dostępu pracujesz z opublikowanymi lekcjami. Bieżące informacje sprawdzisz w ofercie kursu i na swoim koncie.",
  },
  {
    question: "Czy nauka odbywa się o ustalonych godzinach?",
    answer:
      "Z materiałami kursu pracujesz we własnym tempie, w okresie wynikającym z wybranego dostępu. Korepetycje online to osobne, indywidualne spotkania — ich termin wybierasz w kalendarzu rezerwacji.",
  },
];

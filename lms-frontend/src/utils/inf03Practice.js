export const INF03_PATH = "/egzaminy/inf-03";

// Original, openly published practice questions, not leaked course tests or CKE papers.
export const INF03_QUESTIONS = [
    { id: "html-label", topic: "HTML", question: "Który atrybut elementu label wiąże etykietę z polem formularza o wskazanym id?", options: ["name", "for", "value", "href"], correct: 1, explanation: "Atrybut for etykiety wskazuje id pola. Na przykład <label for=\"email\"> wiąże się z <input id=\"email\">. Kliknięcie etykiety pozwala przenieść fokus do pola." },
    { id: "css-class", topic: "CSS", question: "Który selektor wybierze wszystkie elementy z klasą karta?", options: ["#karta", "karta", ".karta", "*karta"], correct: 2, explanation: "Kropka oznacza selektor klasy: .karta. Znak # służy do wyboru elementu o konkretnym id, a sama nazwa karta byłaby selektorem typu elementu." },
    { id: "sql-where", topic: "SQL", question: "Które zapytanie pobierze tylko rekordy z tabeli produkty, których cena jest większa niż 100?", options: ["SELECT * FROM produkty ORDER BY cena > 100;", "SELECT cena > 100 FROM produkty;", "SELECT * FROM produkty WHERE cena < 100;", "SELECT * FROM produkty WHERE cena > 100;"], correct: 3, explanation: "WHERE filtruje wiersze według warunku. Operator > nie obejmuje wartości równej 100. ORDER BY zmienia kolejność wyniku, ale nie usuwa wierszy niespełniających warunku." },
    { id: "sql-key", topic: "Bazy danych", question: "Jaką rolę pełni klucz główny tabeli w relacyjnej bazie danych?", options: ["Jednoznacznie identyfikuje wiersz tabeli.", "Zawsze sortuje wszystkie wyniki alfabetycznie.", "Pozwala przechowywać tylko tekst.", "Automatycznie usuwa puste tabele."], correct: 0, explanation: "Klucz główny identyfikuje wiersz; jego wartość musi być unikalna i nie może być NULL. Może składać się z jednej lub kilku kolumn. Nie oznacza to automatycznego sortowania wyników SELECT." },
    { id: "php-concat", topic: "PHP", question: "Który operator w PHP służy do łączenia dwóch łańcuchów znaków?", options: ["+", ".", "&", "::"], correct: 1, explanation: "W PHP konkatenacja używa kropki. Wyrażenie \"Edu\" . \"Hub\" daje \"EduHub\". Operator + jest operatorem dodawania, a nie łączenia tekstów." },
    { id: "js-array", topic: "JavaScript", question: "Jaki wynik da odczyt [10, 20, 30].length?", options: ["2", "30", "3", "60"], correct: 2, explanation: "Właściwość length tej tablicy ma wartość 3. To nie ostatni indeks: indeksy elementów to 0, 1 i 2. Odczyt length nie sumuje wartości w tablicy." },
];

export function gradeInf03Practice(answers) {
    const answered = INF03_QUESTIONS.filter(item => Number.isInteger(answers[item.id]) && answers[item.id] >= 0 && answers[item.id] < item.options.length);
    return { complete: answered.length === INF03_QUESTIONS.length, answered: answered.length,
        correct: answered.filter(item => answers[item.id] === item.correct).length, total: INF03_QUESTIONS.length };
}

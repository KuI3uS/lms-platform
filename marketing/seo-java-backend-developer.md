# SEO kursu Java Backend Developer

Adres oferty: https://edu-hub.com.pl/kurs/java-backend-developer

## Wdrożone w kodzie

- Tytuł i opis strony skupione na kursie Java online od podstaw.
- Pełna treść oferty generowana do HTML podczas budowania aplikacji: opis,
  początek programu, ćwiczenie i FAQ. Ten sam komponent React wyświetla stronę
  w przeglądarce, dzięki czemu nie trzeba utrzymywać dwóch wersji treści.
- Osobny punkt wejścia oferty i aktywacja gotowego HTML przez React.
- Dane JSON-LD: Course, WebPage, WebSite, Organization i BreadcrumbList.
  Bez wpisywania na stałe ceny, ocen ani liczby lekcji.
- Jedna wersja kanoniczna URL i stałe przekierowanie z pliku HTML.
- Metadane Open Graph i Twitter do udostępniania linku.
- Udostępnienie robotom publicznego API programu i ceny. Pozostałe endpointy
  API nadal mają dotychczasową regułę w robots.txt.
- Istniejąca mapa witryny zawiera stronę główną i ofertę kursu.

Zmiany zaczną działać w domenie po wdrożeniu frontendu na Vercel.
Polecenie budowania projektu musi być `npm run build`, ponieważ obejmuje ono
również wygenerowanie treści HTML. Samo `vite build` pomija ten krok.
Katalog projektu na Vercel: `lms-frontend`; katalog wynikowy: `dist`.
Budowanie nie wymaga połączenia z backendem ani sekretów.

Sprawdzenie lokalne, ze standardowym Node.js zgodnym z wymaganiami Vite 8:

```sh
cd lms-frontend
npm ci
npm run build
node --test tests/*.test.mjs
```

## Google Search Console po publikacji

1. Otwórz https://search.google.com/search-console i sprawdź listę usług.
   Jeśli domena jest już dodana, wybierz ją.
2. Jeśli jej nie ma, dodaj usługę typu **Domena**: `edu-hub.com.pl`.
   Google wygeneruje indywidualny rekord TXT do dodania w DNS domeny.
   Użyj dokładnej wartości z panelu Google, a następnie kliknij **Zweryfikuj**.
3. W sekcji **Mapy witryn** zgłoś `https://edu-hub.com.pl/sitemap.xml`.
4. W **Sprawdzaniu adresu URL** wpisz adres oferty. Uruchom test wersji
   opublikowanej, sprawdź wyrenderowaną stronę i poproś o indeksowanie.
5. Sprawdź dane strony w narzędziu https://search.google.com/test/rich-results.
   BreadcrumbList i Course opisują stronę; same znaczniki nie gwarantują
   rozszerzonego wyniku. Pojedynczy kurs nie spełnia wymogu listy co najmniej
   trzech kursów dla funkcji Course list. Nie dodawaj fikcyjnych kursów ani ocen.
6. Po zebraniu danych obserwuj wyświetlenia, kliknięcia, CTR oraz zapytania
   prowadzące do tej konkretnej strony. Zapisz stan początkowy i porównuj
   kolejne okresy o tej samej długości.

Indeksowanie oraz pozycje zależą od Google; publikacja zmian nie oznacza,
że strona od razu pojawi się na wysokich pozycjach.

## Promocja przez pierwsze cztery tygodnie

Poniższe frazy to propozycje tematyczne wynikające z programu, a nie pomiar
liczby wyszukiwań: „kurs Java online”, „kurs Java od podstaw”,
„nauka Javy dla początkujących”, „Java Backend Developer”.

| Tydzień | Materiał | Dokąd kieruje |
| --- | --- | --- |
| 1 | Krótkie ćwiczenie z wynikiem programu i wyjaśnieniem | Do ćwiczenia i oferty kursu |
| 2 | Poradnik: „JDK, JRE i JVM — czym się różnią?” | Do sekcji programu kursu |
| 3 | Poradnik: „Pierwszy program Java: main i System.out.println” | Do oferty i przykładowego zadania |
| 4 | Poradnik: „Typy danych w Javie: int, double i boolean na przykładach” | Do programu i ceny kursu |

Twórz materiały z konkretnym kodem, wynikiem i wyjaśnieniem. Dodawaj odnośnik
do oferty w miejscu, w którym pomaga czytelnikowi przejść do dalszej nauki.
W opisach profili i publikacjach używaj jednego adresu oferty; w postach
można dodać UTM, np.:

```text
https://edu-hub.com.pl/kurs/java-backend-developer?utm_source=linkedin&utm_medium=organic_social&utm_campaign=java_podstawy
```

Gotowe wcześniejsze propozycje postów są w `marketing/java-backend-developer.md`.
Ten dokument jest planem; żadne publikacje ani kampanie reklamowe nie zostały
automatycznie uruchomione. Przed dodaniem płatnej promocji warto skonfigurować
pomiar przejść do rejestracji i zakupów. Sam parametr UTM nie zbiera statystyk.

Źródła:

- https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
- https://developers.google.com/search/docs/appearance/structured-data/course
- https://support.google.com/webmasters/answer/9008080

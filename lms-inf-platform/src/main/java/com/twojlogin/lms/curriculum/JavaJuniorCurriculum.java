package com.twojlogin.lms.curriculum;

import java.util.List;

/**
 * Wersjonowany, edytowalny katalog treści kursu. Dane są trzymane w kodzie,
 * aby import był deterministyczny i nie zależał od zewnętrznego generatora.
 */
public final class JavaJuniorCurriculum {

    public static final String NAME = "Java Junior Developer 2026";
    public static final String VERSION = "2026.1";

    private JavaJuniorCurriculum() {
    }

    public record ModuleSpec(
            int number,
            String focus,
            String theory,
            String exampleCode,
            String taskInstruction,
            String expectedAnswer,
            String quizQuestion,
            List<String> quizOptions,
            String quizAnswer,
            String language
    ) {
    }

    public static List<ModuleSpec> modules() {
        return List.of(
                m(1, "Jak działa program i jak przygotować warsztat",
                        "Program to precyzyjny zestaw instrukcji wykonywanych przez komputer. Kod źródłowy Javy kompiluje się do bytecode, a JVM uruchamia go na różnych systemach.\n\n"
                                + "Zainstaluj JDK 25 LTS i IntelliJ IDEA. W tym kursie pracujemy w jednym repozytorium Git, a każdy większy etap kończymy działającym fragmentem projektu. Uczysz się przez cykl: przeczytaj, uruchom, zmień, zepsuj, napraw i dopiero wtedy przejdź dalej.",
                        "javac Main.java\njava Main\n\n// JDK kompiluje kod, JVM uruchamia bytecode.",
                        "Wpisz trzy kroki pracy programisty w poprawnej kolejności: napisz kod, skompiluj, uruchom.",
                        "napisz kod\nskompiluj\nuruchom",
                        "Który element uruchamia bytecode Javy?",
                        "JVM", "JDK", "IntelliJ IDEA", "Maven", "text"),

                m(2, "Pierwsza aplikacja i metoda main",
                        "Klasa grupuje kod, a public static void main(String[] args) jest punktem startowym klasycznej aplikacji konsolowej. Wielkość liter ma znaczenie, instrukcje kończymy średnikiem, a tekst zapisujemy w cudzysłowie.\n\n"
                                + "W IntelliJ utwórz projekt Java z JDK 25, pakiet pl.eduhub.start i klasę Main. Uruchamiaj kod zieloną ikoną obok metody main oraz skrótem ponownego uruchomienia.",
                        "package pl.eduhub.start;\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Witaj w Javie!\");\n    }\n}",
                        "Uzupełnij program tak, aby metoda main wyświetliła dokładnie: Witaj, Junior Java Developer!",
                        "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Witaj, Junior Java Developer!\");\n    }\n}",
                        "Która metoda jest klasycznym punktem wejścia programu Java?",
                        "public static void main(String[] args)", "public void start()", "static int run()", "void java()", "java"),

                m(3, "Zmienne, typy proste i var",
                        "Zmienna ma nazwę, typ i wartość. Typy proste przechowują m.in. liczby (int, long, double), pojedynczy znak (char) i prawdę/fałsz (boolean). String jest obiektem reprezentującym tekst.\n\n"
                                + "Używaj nazw opisujących znaczenie, np. lessonCount. var skraca zapis lokalnej zmiennej, lecz kompilator nadal zna jej konkretny typ. Nie używaj var, gdy zaciemnia intencję.",
                        "int lessonCount = 52;\nlong users = 10_000L;\ndouble price = 1000.0;\nboolean published = true;\nvar courseName = \"Java od podstaw\";",
                        "Zadeklaruj zmienne: age o wartości 18, price o wartości 999.99 i active o wartości true.",
                        "int age = 18;\ndouble price = 999.99;\nboolean active = true;",
                        "Który typ przechowuje wartość true albo false?",
                        "boolean", "int", "String", "char", "java"),

                m(4, "Operatory, priorytety i bezpieczne obliczenia",
                        "Operatory arytmetyczne wykonują obliczenia, porównania zwracają boolean, a && i || łączą warunki. Dzielenie dwóch int usuwa część ułamkową; co najmniej jeden operand musi być double, aby zachować ułamek.\n\n"
                                + "Nie zapisuj pieniędzy jako double w systemach biznesowych. Później użyjemy BigDecimal, ponieważ liczby zmiennoprzecinkowe nie odwzorowują dokładnie wielu wartości dziesiętnych.",
                        "int completed = 13;\nint all = 52;\ndouble progress = completed * 100.0 / all;\nboolean halfway = progress >= 50.0;\nSystem.out.println(progress);",
                        "Oblicz pole prostokąta o width 8 i height 5, zapisz je w area i wyświetl.",
                        "int width = 8;\nint height = 5;\nint area = width * height;\nSystem.out.println(area);",
                        "Jaki będzie wynik wyrażenia 5 / 2 dla dwóch wartości int?",
                        "2", "2.5", "3", "Błąd kompilacji", "java"),

                m(5, "Decyzje w programie: if, else if i else",
                        "Instrukcja if wykonuje blok tylko wtedy, gdy warunek ma wartość true. else if pozwala sprawdzać kolejne przypadki, a else obsługuje pozostałe. Najpierw ustawiaj warunki najbardziej szczegółowe.\n\n"
                                + "Złożony warunek nazwij zmienną lub wydziel do metody. Dzięki temu kod mówi, dlaczego podejmowana jest decyzja, a nie tylko jak ją policzono.",
                        "int score = 82;\nif (score >= 90) {\n    System.out.println(\"celujący\");\n} else if (score >= 60) {\n    System.out.println(\"zaliczony\");\n} else {\n    System.out.println(\"do poprawy\");\n}",
                        "Dla age równego 20 wyświetl dorosły, gdy age >= 18, w przeciwnym razie niepełnoletni.",
                        "int age = 20;\nif (age >= 18) {\n    System.out.println(\"dorosły\");\n} else {\n    System.out.println(\"niepełnoletni\");\n}",
                        "Jaki typ musi mieć warunek instrukcji if?",
                        "boolean", "int", "String", "dowolny obiekt", "java"),

                m(6, "Czytelny wybór z użyciem switch",
                        "switch sprawdza jedną wartość względem wielu przypadków. Nowoczesne wyrażenie switch używa strzałek, nie wymaga break i może zwracać wartość. default obsługuje nieznany przypadek.\n\n"
                                + "W Java 25 stosuj switch jako wyrażenie, gdy mapujesz jedną wartość na wynik. Klasyczny zapis z case i break poznaj po to, by rozumieć istniejący kod.",
                        "String role = \"ADMIN\";\nString label = switch (role) {\n    case \"ADMIN\" -> \"Administrator\";\n    case \"USER\" -> \"Użytkownik\";\n    default -> \"Gość\";\n};",
                        "Utwórz zmienną day równą 2 i wyrażeniem switch przypisz name: 1 -> poniedziałek, 2 -> wtorek, pozostałe -> inny.",
                        "int day = 2;\nString name = switch (day) {\n    case 1 -> \"poniedziałek\";\n    case 2 -> \"wtorek\";\n    default -> \"inny\";\n};",
                        "Który przypadek switch obsługuje wartości niedopasowane?",
                        "default", "else", "fallback", "finally", "java"),

                m(7, "Powtarzanie pracy: for, while i do-while",
                        "for sprawdza się, gdy znasz liczbę powtórzeń. while działa, dopóki warunek jest prawdziwy, a do-while wykona ciało co najmniej raz. break kończy pętlę, continue przechodzi do następnego obrotu.\n\n"
                                + "Każda pętla musi mieć czytelny warunek zakończenia. Przy nieskończonej pętli w IntelliJ użyj przycisku Stop, a potem sprawdź, czy zmienna sterująca rzeczywiście się zmienia.",
                        "for (int i = 1; i <= 3; i++) {\n    System.out.println(\"Lekcja \" + i);\n}\n\nint attempts = 0;\nwhile (attempts < 3) {\n    attempts++;\n}",
                        "Napisz pętlę for, która wyświetla liczby od 1 do 5.",
                        "for (int i = 1; i <= 5; i++) {\n    System.out.println(i);\n}",
                        "Która pętla wykona ciało co najmniej jeden raz?",
                        "do-while", "while", "for", "enhanced for", "java"),

                m(8, "Tablice i indeksy",
                        "Tablica przechowuje stałą liczbę elementów jednego typu. Pierwszy element ma indeks 0, a ostatni length - 1. Wyjście poza zakres powoduje ArrayIndexOutOfBoundsException.\n\n"
                                + "Do przejścia po wszystkich wartościach używaj enhanced for. Klasycznej pętli indeksowej potrzebujesz, gdy indeks ma znaczenie lub modyfikujesz konkretne miejsce.",
                        "int[] points = {10, 20, 30};\nint sum = 0;\nfor (int point : points) {\n    sum += point;\n}\nSystem.out.println(sum);",
                        "Utwórz tablicę names z wartościami Ada, Ola, Jan i wyświetl drugi element.",
                        "String[] names = {\"Ada\", \"Ola\", \"Jan\"};\nSystem.out.println(names[1]);",
                        "Jaki indeks ma pierwszy element tablicy?",
                        "0", "1", "-1", "length", "java"),

                m(9, "String, porównywanie i przetwarzanie tekstu",
                        "String jest niemutowalny: operacja tworząca zmieniony tekst zwraca nowy obiekt. Do porównywania treści używaj equals, nigdy ==. Przy wielu doklejeniach w pętli wybierz StringBuilder.\n\n"
                                + "Poznaj trim/strip, contains, startsWith, substring, split i formatowanie. Dane od użytkownika normalizuj przed walidacją, np. przez strip i toLowerCase.",
                        "String email = \"  USER@Example.com \";\nString normalized = email.strip().toLowerCase();\nboolean validDomain = normalized.endsWith(\"@example.com\");\nSystem.out.println(normalized);",
                        "Dla name równego \"  Java \" utwórz cleaned przez strip(), a następnie wyświetl cleaned.toUpperCase().",
                        "String name = \"  Java \";\nString cleaned = name.strip();\nSystem.out.println(cleaned.toUpperCase());",
                        "Jak poprawnie porównać treść dwóch obiektów String?",
                        "first.equals(second)", "first == second", "first = second", "compare(first, second)", "java"),

                m(10, "Metody, parametry i wartość zwracana",
                        "Metoda nazywa fragment zachowania, przyjmuje parametry i może zwracać wynik. Sygnatura obejmuje nazwę oraz typy parametrów. Małe metody łatwiej czytać, testować i ponownie wykorzystywać.\n\n"
                                + "Nie drukuj wyniku wewnątrz metody obliczeniowej, jeśli może go zwrócić. Warstwa wywołująca zdecyduje, czy wynik wyświetlić, zapisać czy przesłać przez API.",
                        "static int add(int left, int right) {\n    return left + right;\n}\n\nint result = add(2, 3);",
                        "Napisz statyczną metodę square przyjmującą int number i zwracającą jego kwadrat.",
                        "static int square(int number) {\n    return number * number;\n}",
                        "Które słowo zwraca wartość z metody?",
                        "return", "yield", "result", "send", "java"),

                m(11, "Czytanie błędów i debugowanie w IntelliJ",
                        "Błąd kompilacji zatrzymuje budowanie, wyjątek przerywa działanie w runtime, a błąd logiczny daje niepoprawny wynik bez awarii. Czytaj pierwszy istotny komunikat i pierwszą linię własnego kodu w stack trace.\n\n"
                                + "Breakpoint zatrzymuje program przed wybraną linią. Step Over wykonuje bieżącą linię, Step Into wchodzi do metody, a Variables pokazuje stan. Nie naprawiaj losowo — postaw hipotezę i sprawdź ją.",
                        "int total = 10;\nint count = 0;\n// int average = total / count; // ArithmeticException\n\nif (count == 0) {\n    System.out.println(\"Brak danych\");\n}",
                        "Zabezpiecz dzielenie total przez count: gdy count jest 0, wyświetl Brak danych; inaczej wyświetl wynik.",
                        "if (count == 0) {\n    System.out.println(\"Brak danych\");\n} else {\n    System.out.println(total / count);\n}",
                        "Który widok debuggera pokazuje bieżące wartości zmiennych?",
                        "Variables", "Terminal", "Commit", "Problems tylko", "java"),

                m(12, "Myślenie obiektowe",
                        "Programowanie obiektowe łączy stan i zachowanie w obiektach. Klasa jest projektem, obiekt jej konkretnym egzemplarzem, a metoda opisuje zachowanie. Modeluj pojęcia domeny, nie ekrany ani tabele.\n\n"
                                + "Dobra klasa pilnuje własnych reguł. Zamiast przenosić dane i sprawdzać je wszędzie, powierz obiektowi operacje, które mogą zmieniać jego poprawny stan.",
                        "class CourseProgress {\n    private int completed;\n\n    void completeLesson() {\n        completed++;\n    }\n\n    int completedLessons() {\n        return completed;\n    }\n}",
                        "Utwórz klasę Counter z polem value, metodą increment zwiększającą je o 1 i metodą value() zwracającą wynik.",
                        "class Counter {\n    private int value;\n\n    void increment() {\n        value++;\n    }\n\n    int value() {\n        return value;\n    }\n}",
                        "Czym jest obiekt?",
                        "Egzemplarzem klasy posiadającym stan i zachowanie", "Plikiem źródłowym", "Typem pętli", "Biblioteką JDK", "java"),

                m(13, "Klasy i współpraca obiektów",
                        "Klasa definiuje pola i metody, a operator new tworzy obiekt. Referencja wskazuje obiekt; dwie referencje mogą wskazywać ten sam egzemplarz. Null oznacza brak referencji i wymaga świadomej obsługi.\n\n"
                                + "Oddziel klasy domenowe od klasy uruchomieniowej. Main powinien składać obiekty i rozpoczynać scenariusz, a logika biznesowa powinna mieszkać w nazwanych klasach.",
                        "class Student {\n    String name;\n\n    void introduce() {\n        System.out.println(\"Jestem \" + name);\n    }\n}\n\nStudent student = new Student();\nstudent.name = \"Ada\";\nstudent.introduce();",
                        "Utwórz klasę Book z polem title, następnie obiekt book, ustaw tytuł Java i wyświetl go.",
                        "class Book {\n    String title;\n}\n\nBook book = new Book();\nbook.title = \"Java\";\nSystem.out.println(book.title);",
                        "Co robi operator new?",
                        "Tworzy nowy obiekt", "Dziedziczy klasę", "Usuwa obiekt", "Kompiluje projekt", "java"),

                m(14, "Konstruktory i poprawny stan od początku",
                        "Konstruktor ma nazwę klasy i nie deklaruje typu zwracanego. Służy do utworzenia obiektu w poprawnym stanie. this rozróżnia pole od parametru i pozwala wywołać inny konstruktor.\n\n"
                                + "Jeżeli wartość jest obowiązkowa, przyjmij ją w konstruktorze. Unikniesz obiektu częściowo skonfigurowanego, który może wywołać błąd wiele linii później.",
                        "class User {\n    private final String email;\n\n    User(String email) {\n        this.email = email;\n    }\n\n    String email() {\n        return email;\n    }\n}",
                        "Dodaj klasie Product finalne pole name, konstruktor przyjmujący name oraz metodę name() zwracającą pole.",
                        "class Product {\n    private final String name;\n\n    Product(String name) {\n        this.name = name;\n    }\n\n    String name() {\n        return name;\n    }\n}",
                        "Czy konstruktor deklaruje typ zwracany?",
                        "Nie", "Tak, zawsze void", "Tak, typ klasy", "Tylko przy public", "java"),

                m(15, "Enkapsulacja i ochrona niezmienników",
                        "Enkapsulacja ukrywa szczegóły i udostępnia bezpieczne operacje. Pola najczęściej są private, ale nie każda właściwość potrzebuje bezwarunkowego settera. Metoda domenowa lepiej komunikuje zamiar.\n\n"
                                + "Niezmiennik to reguła prawdziwa przez całe życie obiektu, np. saldo nie może spaść poniżej zera. Sprawdzaj ją w miejscu zmiany stanu.",
                        "class Wallet {\n    private int balance;\n\n    void deposit(int amount) {\n        if (amount <= 0) throw new IllegalArgumentException();\n        balance += amount;\n    }\n\n    int balance() { return balance; }\n}",
                        "Utwórz klasę Score z prywatnym polem points i metodą add, która odrzuca wartości ujemne.",
                        "class Score {\n    private int points;\n\n    void add(int value) {\n        if (value < 0) throw new IllegalArgumentException();\n        points += value;\n    }\n}",
                        "Jaki modyfikator najlepiej ukrywa pole przed innymi klasami?",
                        "private", "public", "static", "abstract", "java"),

                m(16, "Dziedziczenie i relacja is-a",
                        "Dziedziczenie pozwala klasie potomnej rozszerzyć klasę bazową. Używaj go tylko dla prawdziwej relacji is-a i wspólnego kontraktu. Konstruktor potomny wywołuje super, a metoda może zostać nadpisana.\n\n"
                                + "W kodzie biznesowym często lepsza jest kompozycja: obiekt posiada współpracownika zamiast dziedziczyć implementację. Dziedziczenie silnie wiąże klasy.",
                        "class User {\n    String label() { return \"Użytkownik\"; }\n}\n\nclass Admin extends User {\n    @Override\n    String label() { return \"Administrator\"; }\n}",
                        "Utwórz klasę Dog dziedziczącą po Animal i nadpisz metodę sound(), aby zwracała hau.",
                        "class Animal {\n    String sound() { return \"dźwięk\"; }\n}\n\nclass Dog extends Animal {\n    @Override\n    String sound() { return \"hau\"; }\n}",
                        "Które słowo tworzy relację dziedziczenia klas?",
                        "extends", "implements", "inherits", "super", "java"),

                m(17, "Polimorfizm i programowanie do kontraktu",
                        "Polimorfizm pozwala używać różnych implementacji przez wspólny typ. Wywołana zostaje metoda rzeczywistego obiektu, nie typu zmiennej. Dzięki temu kod klienta nie zna szczegółów implementacji.\n\n"
                                + "Zamiast rozbudowanego if sprawdzającego rodzaj obiektu, rozważ wspólny kontrakt i osobne implementacje. Nowy wariant nie powinien wymagać edycji każdego klienta.",
                        "interface NotificationSender {\n    void send(String message);\n}\n\nvoid notify(NotificationSender sender) {\n    sender.send(\"Kurs odblokowany\");\n}",
                        "Zadeklaruj interfejs Payment z metodą pay(), a następnie metodę checkout przyjmującą Payment i wywołującą pay().",
                        "interface Payment {\n    void pay();\n}\n\nstatic void checkout(Payment payment) {\n    payment.pay();\n}",
                        "Co daje polimorfizm?",
                        "Wiele implementacji używanych przez wspólny typ", "Wiele pól o tej samej nazwie", "Automatyczne testy", "Brak konstruktorów", "java"),

                m(18, "Klasy abstrakcyjne i interfejsy",
                        "Interfejs opisuje kontrakt i wspiera wiele implementacji. Klasa abstrakcyjna może dodatkowo przechowywać wspólny stan i implementację. Nie można bezpośrednio utworzyć jej obiektu.\n\n"
                                + "Wstrzykuj zależności przez interfejsy na granicach systemu. Klasa abstrakcyjna ma sens, gdy warianty rzeczywiście dzielą stabilny kod oraz stan.",
                        "interface Clock {\n    java.time.Instant now();\n}\n\nabstract class Report {\n    abstract String title();\n\n    String header() { return \"Raport: \" + title(); }\n}",
                        "Utwórz interfejs Shape z metodą area() zwracającą double.",
                        "interface Shape {\n    double area();\n}",
                        "Czy klasa może implementować więcej niż jeden interfejs?",
                        "Tak", "Nie", "Tylko gdy jest abstract", "Tylko interfejs z jedną metodą", "java"),

                m(19, "Enum jako zamknięty zbiór wartości",
                        "Enum reprezentuje skończony zbiór nazwanych wartości i jest bezpieczniejszy niż przypadkowe napisy. Może mieć pola, konstruktor i metody. Porównuj wartości enum operatorem ==.\n\n"
                                + "Użyj enum dla statusu zamówienia, roli czy priorytetu. Nie stosuj go do danych, które administrator ma dodawać bez wdrażania nowej wersji aplikacji.",
                        "enum OrderStatus {\n    NEW, PAID, CANCELLED\n}\n\nOrderStatus status = OrderStatus.PAID;\nif (status == OrderStatus.PAID) {\n    System.out.println(\"Opłacone\");\n}",
                        "Zdefiniuj enum Priority z wartościami LOW, MEDIUM i HIGH.",
                        "enum Priority {\n    LOW, MEDIUM, HIGH\n}",
                        "Kiedy enum jest dobrym wyborem?",
                        "Gdy zbiór możliwych wartości jest zamknięty", "Dla dowolnego tekstu użytkownika", "Dla każdej liczby", "Zamiast wszystkich klas", "java"),

                m(20, "Wyjątki i czytelna obsługa błędów",
                        "Wyjątek opisuje nietypowy przebieg, którego bieżąca metoda nie potrafi obsłużyć. Rzucaj wyjątek z konkretnym komunikatem, łap go tam, gdzie można podjąć sensowną decyzję, i nie ignoruj catch.\n\n"
                                + "Checked exceptions wymagają deklaracji lub obsługi, unchecked zwykle wskazują błąd danych lub kontraktu. try-with-resources automatycznie zamyka zasoby.",
                        "static int requirePositive(int value) {\n    if (value <= 0) {\n        throw new IllegalArgumentException(\"value must be positive\");\n    }\n    return value;\n}",
                        "Napisz metodę parseAge: jeśli text jest pusty, rzuć IllegalArgumentException z komunikatem age is required; inaczej zwróć Integer.parseInt(text).",
                        "static int parseAge(String text) {\n    if (text == null || text.isBlank()) {\n        throw new IllegalArgumentException(\"age is required\");\n    }\n    return Integer.parseInt(text);\n}",
                        "Która konstrukcja automatycznie zamyka zasób?",
                        "try-with-resources", "try-finally bez close", "throw", "assert", "java"),

                m(21, "Kolekcje List, Set i Map",
                        "List zachowuje kolejność i dopuszcza duplikaty, Set pilnuje unikalności, a Map łączy klucz z wartością. Wybierz kolekcję na podstawie reguł domeny, nie przyzwyczajenia.\n\n"
                                + "Programuj do interfejsu, np. List<String>, a konkretną implementację wybieraj przy tworzeniu. List.of i Set.of tworzą niemodyfikowalne kolekcje.",
                        "List<String> lessons = new ArrayList<>();\nlessons.add(\"Zmienne\");\nlessons.add(\"Pętle\");\n\nSet<String> tags = Set.of(\"java\", \"backend\");\nMap<Long, String> users = Map.of(1L, \"Ada\");",
                        "Utwórz List<String> skills, dodaj Java i SQL, a następnie wyświetl liczbę elementów.",
                        "List<String> skills = new ArrayList<>();\nskills.add(\"Java\");\nskills.add(\"SQL\");\nSystem.out.println(skills.size());",
                        "Która kolekcja przechowuje pary klucz-wartość?",
                        "Map", "List", "Set", "Queue wyłącznie", "java"),

                m(22, "Generics i bezpieczeństwo typów",
                        "Generics pozwalają pisać klasy i metody działające z różnymi typami bez rzutowania. List<String> przyjmuje tylko napisy, a błąd zostanie wykryty podczas kompilacji.\n\n"
                                + "Parametry typów nazywa się zwykle T, E, K i V. Wildcard ? extends służy głównie do odczytu, a ? super do zapisu — zapamiętaj zasadę PECS.",
                        "record Box<T>(T value) {}\n\nBox<String> text = new Box<>(\"Java\");\nString value = text.value();\n\nstatic <T> T first(List<T> values) {\n    return values.get(0);\n}",
                        "Utwórz generyczny record Pair<A, B> z polami first i second.",
                        "record Pair<A, B>(A first, B second) {}",
                        "Co daje List<String> względem surowego List?",
                        "Sprawdzanie typu podczas kompilacji", "Większą liczbę elementów", "Automatyczny zapis do bazy", "Dziedziczenie wielokrotne", "java"),

                m(23, "Lambda, Optional i Stream API",
                        "Lambda jest krótką implementacją interfejsu funkcyjnego. Stream opisuje potok operacji: źródło, operacje pośrednie i terminalną. Nie modyfikuje źródłowej kolekcji.\n\n"
                                + "Używaj filter, map, sorted i collect/toList, gdy kod opisuje transformację. Zwykła pętla bywa czytelniejsza dla złożonego sterowania. Optional modeluje możliwy brak wyniku metody.",
                        "List<String> names = List.of(\"Ada\", \"Jan\", \"Ola\");\nList<String> longNames = names.stream()\n        .filter(name -> name.length() >= 3)\n        .map(String::toUpperCase)\n        .toList();",
                        "Z listy numbers utwórz even zawierającą tylko liczby parzyste przy użyciu stream, filter i toList.",
                        "List<Integer> even = numbers.stream()\n        .filter(number -> number % 2 == 0)\n        .toList();",
                        "Czy Stream modyfikuje źródłową kolekcję?",
                        "Nie", "Tak, zawsze", "Tylko filter", "Tylko map", "java"),

                m(24, "Nowoczesne API daty i czasu",
                        "Pakiet java.time rozdziela datę, czas, strefę i chwilę. LocalDate nie ma strefy, Instant oznacza punkt na osi czasu, a ZonedDateTime zawiera strefę. Duration mierzy czas, Period daty.\n\n"
                                + "W systemach backendowych przechowuj zdarzenia jako Instant, a strefę użytkownika stosuj przy prezentacji. W testach wstrzykuj Clock zamiast wywoływać now() wszędzie.",
                        "LocalDate start = LocalDate.of(2026, 7, 27);\nLocalDate deadline = start.plusDays(14);\n\nInstant createdAt = Instant.now();\nDuration ttl = Duration.ofMinutes(15);",
                        "Utwórz LocalDate courseStart dla 2026-09-01 i zmienną nextWeek równą courseStart.plusWeeks(1).",
                        "LocalDate courseStart = LocalDate.of(2026, 9, 1);\nLocalDate nextWeek = courseStart.plusWeeks(1);",
                        "Który typ najlepiej opisuje punkt na globalnej osi czasu?",
                        "Instant", "LocalDate", "Period", "Month", "java"),

                m(25, "Pliki, Path i bezpieczne I/O",
                        "Nowoczesne API plików opiera się na Path i Files. Kodowanie znaków podawaj jawnie, zwykle UTF-8. Duże pliki przetwarzaj strumieniowo, zamiast wczytywać całość do pamięci.\n\n"
                                + "Operacje I/O mogą się nie udać, dlatego obsługuj IOException na odpowiednim poziomie. Ścieżek i nazw plików od użytkownika nie łącz bez walidacji.",
                        "Path path = Path.of(\"notes.txt\");\nFiles.writeString(path, \"Java 25\", StandardCharsets.UTF_8);\nString content = Files.readString(path, StandardCharsets.UTF_8);",
                        "Utwórz Path do pliku course.txt i zapisz do niego tekst Junior Java z UTF_8.",
                        "Path path = Path.of(\"course.txt\");\nFiles.writeString(path, \"Junior Java\", StandardCharsets.UTF_8);",
                        "Która klasa reprezentuje ścieżkę w nowoczesnym API Javy?",
                        "Path", "FileReader", "StringBuilder", "Scanner", "java"),

                m(26, "Maven i powtarzalny build",
                        "Maven opisuje projekt w pom.xml, pobiera zależności i wykonuje uporządkowany cykl builda. Najważniejsze fazy to compile, test, package i verify. Maven Wrapper pozwala zespołowi użyć ustalonej wersji.\n\n"
                                + "W IntelliJ otwieraj projekt przez pom.xml i sprawdzaj wynik także w terminalu poleceniem ./mvnw verify. Zielony przycisk w IDE nie zastępuje powtarzalnego builda.",
                        "<properties>\n    <maven.compiler.release>25</maven.compiler.release>\n</properties>\n\n<dependencies>\n    <!-- zależności projektu -->\n</dependencies>",
                        "Zapisz polecenie Maven Wrapper, które uruchamia pełną weryfikację projektu bez testów pomijanych.",
                        "./mvnw verify",
                        "Która faza Maven uruchamia weryfikację całego projektu?",
                        "verify", "open", "start", "resolve", "shell"),

                m(27, "Testy jednostkowe z JUnit 5",
                        "Test jednostkowy sprawdza mały fragment zachowania szybko i deterministycznie. Stosuj układ arrange-act-assert, nazwy opisujące scenariusz i jednoznaczne oczekiwania.\n\n"
                                + "JUnit 5 używa @Test oraz metod Assertions. Testuj przypadek poprawny, granice i błędy. Nie testuj prywatnych metod — testuj publiczny kontrakt klasy.",
                        "@Test\nvoid returnsDiscountForPremiumCustomer() {\n    var calculator = new DiscountCalculator();\n\n    int discount = calculator.calculate(true);\n\n    assertEquals(20, discount);\n}",
                        "Napisz test JUnit 5 sprawdzający, że Math.max(3, 7) zwraca 7.",
                        "@Test\nvoid returnsLargerNumber() {\n    assertEquals(7, Math.max(3, 7));\n}",
                        "Która adnotacja oznacza metodę testową w JUnit 5?",
                        "@Test", "@Check", "@Unit", "@Run", "java"),

                m(28, "Git, repozytorium i bezpieczna historia",
                        "Git zapisuje historię zmian lokalnie. Typowy cykl to status, diff, add i commit. Commit powinien opisywać jedną logiczną zmianę i nie zawierać sekretów, plików builda ani ustawień lokalnych.\n\n"
                                + ".gitignore chroni repozytorium przed target, .idea oraz plikami środowiskowymi. GitHub przechowuje zdalne repozytorium, lecz Git działa również bez niego.",
                        "git status\ngit diff\ngit add src pom.xml\ngit commit -m \"Add course progress calculation\"\ngit push",
                        "Zapisz cztery polecenia: sprawdź status, dodaj wszystkie bieżące zmiany, utwórz commit Add first Java exercise, wypchnij branch.",
                        "git status\ngit add .\ngit commit -m \"Add first Java exercise\"\ngit push",
                        "Które polecenie pokazuje niezapisane zmiany w plikach?",
                        "git diff", "git clone", "git init --bare", "git tag", "shell"),

                m(29, "SQL i relacyjne bazy danych",
                        "Tabela przechowuje wiersze o określonych kolumnach. Klucz główny identyfikuje rekord, klucz obcy buduje relację, a ograniczenia chronią spójność danych. SELECT czyta, INSERT dodaje, UPDATE zmienia, DELETE usuwa.\n\n"
                                + "WHERE zawsze przemyśl przed UPDATE i DELETE. JOIN łączy tabele. Indeks przyspiesza odczyt, ale kosztuje miejsce i aktualizacje.",
                        "SELECT u.id, u.email, COUNT(e.id) AS enrollments\nFROM users u\nLEFT JOIN enrollment e ON e.user_id = u.id\nGROUP BY u.id, u.email\nORDER BY enrollments DESC;",
                        "Napisz zapytanie wybierające id i title z tabeli course dla rekordów published = true, posortowane po title.",
                        "SELECT id, title\nFROM course\nWHERE published = true\nORDER BY title;",
                        "Która klauzula filtruje wiersze?",
                        "WHERE", "ORDER BY", "GROUP BY", "SELECT", "sql"),

                m(30, "JDBC i parametryzowane zapytania",
                        "JDBC to niskopoziomowe API komunikacji z bazą. DataSource dostarcza połączenie, PreparedStatement wiąże parametry, a ResultSet udostępnia wynik. try-with-resources zamyka wszystkie zasoby.\n\n"
                                + "Nigdy nie sklejaj danych użytkownika do SQL. Parametry chronią przed SQL injection i poprawnie kodują wartości.",
                        "String sql = \"SELECT id, email FROM users WHERE email = ?\";\ntry (Connection connection = dataSource.getConnection();\n     PreparedStatement statement = connection.prepareStatement(sql)) {\n    statement.setString(1, email);\n    try (ResultSet result = statement.executeQuery()) {\n        // mapowanie wyniku\n    }\n}",
                        "Utwórz PreparedStatement dla DELETE FROM task WHERE id = ? i ustaw pierwszy parametr typu long ze zmiennej id.",
                        "PreparedStatement statement = connection.prepareStatement(\"DELETE FROM task WHERE id = ?\");\nstatement.setLong(1, id);",
                        "Co zabezpiecza zapytanie przed SQL injection?",
                        "PreparedStatement z parametrami", "Sklejanie String", "Komentarz SQL", "ResultSet", "java"),

                m(31, "Hibernate, JPA i mapowanie encji",
                        "JPA definiuje standard mapowania obiektów na relacyjną bazę, a Hibernate jest popularną implementacją. @Entity oznacza encję, @Id klucz, a relacje opisują powiązania.\n\n"
                                + "Encja ma tożsamość i cykl życia. Uważaj na N+1 zapytań, przypadkowe kaskady i relacje EAGER. Granice transakcji umieszczaj w warstwie serwisowej.",
                        "@Entity\nclass Course {\n    @Id\n    @GeneratedValue(strategy = GenerationType.IDENTITY)\n    private Long id;\n\n    @Column(nullable = false)\n    private String title;\n}",
                        "Zdefiniuj encję Tag z generowanym polem id typu Long i wymaganym polem name.",
                        "@Entity\nclass Tag {\n    @Id\n    @GeneratedValue(strategy = GenerationType.IDENTITY)\n    private Long id;\n\n    @Column(nullable = false)\n    private String name;\n}",
                        "Która adnotacja wskazuje klucz główny encji?",
                        "@Id", "@Entity", "@Column", "@Table", "java"),

                m(32, "Spring Boot 4 i budowa aplikacji",
                        "Spring Boot 4 konfiguruje aplikację na podstawie zależności i właściwości, a wstrzykiwanie zależności łączy obiekty. @SpringBootApplication uruchamia skanowanie, konfigurację i serwer.\n\n"
                                + "Preferuj wstrzykiwanie konstruktorem. Konfigurację trzymaj poza kodem w application.properties i zmiennych środowiskowych. Projekt generuj przez start.spring.io lub kreator Spring w IntelliJ.",
                        "@SpringBootApplication\npublic class TaskApplication {\n    public static void main(String[] args) {\n        SpringApplication.run(TaskApplication.class, args);\n    }\n}",
                        "Utwórz klasę CourseApplication z @SpringBootApplication i metodą main uruchamiającą SpringApplication.run.",
                        "@SpringBootApplication\npublic class CourseApplication {\n    public static void main(String[] args) {\n        SpringApplication.run(CourseApplication.class, args);\n    }\n}",
                        "Jaki sposób wstrzykiwania zależności jest preferowany?",
                        "Przez konstruktor", "Do publicznych pól", "Przez zmienne globalne", "Przez new w każdej metodzie", "java"),

                m(33, "Projektowanie REST API",
                        "REST modeluje zasoby przez adresy i standardowe metody HTTP. GET czyta, POST tworzy, PUT zastępuje, PATCH częściowo zmienia, DELETE usuwa. Kody odpowiedzi są częścią kontraktu.\n\n"
                                + "Kontroler powinien mapować HTTP i delegować logikę do serwisu. Nie wystawiaj encji bezpośrednio — używaj requestów i DTO odpowiedzi.",
                        "@RestController\n@RequestMapping(\"/api/tasks\")\nclass TaskController {\n    @GetMapping(\"/{id}\")\n    TaskResponse get(@PathVariable long id) {\n        return service.get(id);\n    }\n}",
                        "Dodaj metodę kontrolera obsługującą POST /api/tasks, przyjmującą @RequestBody CreateTaskRequest i zwracającą service.create(request).",
                        "@PostMapping\nTaskResponse create(@RequestBody CreateTaskRequest request) {\n    return service.create(request);\n}",
                        "Która metoda HTTP służy zwykle do utworzenia zasobu?",
                        "POST", "GET", "HEAD", "OPTIONS", "java"),

                m(34, "Repozytoria Spring Data JPA",
                        "Spring Data generuje implementacje repozytoriów na podstawie interfejsów. JpaRepository zapewnia CRUD, stronicowanie i sortowanie. Nazwa metody może opisać proste zapytanie, a @Query bardziej złożone.\n\n"
                                + "Nie pobieraj całej tabeli, gdy potrzebujesz strony. Optional dobrze opisuje pojedynczy wynik, który może nie istnieć.",
                        "interface TaskRepository extends JpaRepository<Task, Long> {\n    Page<Task> findByOwnerIdAndCompletedFalse(\n            Long ownerId,\n            Pageable pageable\n    );\n}",
                        "Zdefiniuj CourseRepository rozszerzające JpaRepository<Course, Long> z metodą findByPublishedTrueOrderByTitleAsc().",
                        "interface CourseRepository extends JpaRepository<Course, Long> {\n    List<Course> findByPublishedTrueOrderByTitleAsc();\n}",
                        "Co zwraca findById w JpaRepository?",
                        "Optional", "Zawsze encję", "List", "boolean", "java"),

                m(35, "Walidacja danych wejściowych",
                        "Bean Validation sprawdza dane na granicy systemu. @NotBlank, @Size, @Email i @Positive opisują reguły DTO, a @Valid uruchamia walidację w kontrolerze.\n\n"
                                + "Walidacja formatu nie zastępuje reguł biznesowych, np. unikalności emaila. Błędy powinny wskazywać pole i czytelny komunikat, nie wewnętrzny stack trace.",
                        "record CreateUserRequest(\n        @NotBlank @Email String email,\n        @NotBlank @Size(min = 12) String password\n) {}\n\n@PostMapping\nvoid create(@Valid @RequestBody CreateUserRequest request) {}",
                        "Utwórz record CreateCourseRequest z polem title oznaczonym @NotBlank i @Size(max = 120).",
                        "record CreateCourseRequest(\n        @NotBlank @Size(max = 120) String title\n) {}",
                        "Która adnotacja uruchamia walidację requestu w kontrolerze?",
                        "@Valid", "@Value", "@Bean", "@Order", "java"),

                m(36, "Spójna obsługa błędów API",
                        "API powinno zwracać przewidywalny format błędu: kod, komunikat, czas, ścieżkę i opcjonalne błędy pól. @RestControllerAdvice zbiera obsługę wyjątków poza kontrolerami.\n\n"
                                + "Mapuj brak zasobu na 404, konflikt na 409, niepoprawne dane na 400, brak uwierzytelnienia na 401, a brak uprawnień na 403. Nie ujawniaj danych technicznych klientowi.",
                        "@RestControllerAdvice\nclass ApiExceptionHandler {\n    @ExceptionHandler(ResourceNotFoundException.class)\n    ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException ex) {\n        return ResponseEntity.status(404)\n                .body(new ApiError(\"NOT_FOUND\", ex.getMessage()));\n    }\n}",
                        "Napisz handler IllegalArgumentException zwracający status 400 i komunikat wyjątku jako body.",
                        "@ExceptionHandler(IllegalArgumentException.class)\nResponseEntity<String> handleBadRequest(IllegalArgumentException ex) {\n    return ResponseEntity.badRequest().body(ex.getMessage());\n}",
                        "Jaki status oznacza, że zasób nie istnieje?",
                        "404 Not Found", "200 OK", "201 Created", "403 Forbidden", "java"),

                m(37, "Spring Security i ochrona endpointów",
                        "Spring Security buduje łańcuch filtrów uwierzytelniania i autoryzacji. Uwierzytelnianie odpowiada „kim jesteś”, autoryzacja „co wolno ci zrobić”. Hasła przechowuj wyłącznie jako bezpieczny hash.\n\n"
                                + "Konfiguruj dostęp regułami najmniejszego uprawnienia, wyłączaj CSRF tylko świadomie dla bezstanowego API i zawsze używaj HTTPS w produkcji.",
                        "@Bean\nSecurityFilterChain security(HttpSecurity http) throws Exception {\n    return http\n            .authorizeHttpRequests(auth -> auth\n                    .requestMatchers(\"/api/auth/**\").permitAll()\n                    .anyRequest().authenticated())\n            .build();\n}",
                        "Dodaj do konfiguracji regułę, która pozwala każdemu na /api/public/**, a pozostałe żądania wymagają uwierzytelnienia.",
                        ".authorizeHttpRequests(auth -> auth\n        .requestMatchers(\"/api/public/**\").permitAll()\n        .anyRequest().authenticated())",
                        "Czym różni się autoryzacja od uwierzytelniania?",
                        "Autoryzacja sprawdza uprawnienia, uwierzytelnianie tożsamość", "Nie różni się", "Autoryzacja hashuje hasło", "Uwierzytelnianie nadaje role", "java"),

                m(38, "JWT i bezstanowe logowanie",
                        "JWT jest podpisanym tokenem zawierającym claims. Serwer weryfikuje podpis i datę wygaśnięcia bez sesji po stronie serwera. Token nie jest zaszyfrowany — nie umieszczaj w nim sekretów.\n\n"
                                + "Access token powinien żyć krótko. Klucz podpisujący trzymaj poza repozytorium, rotuj go i waliduj algorytm. W przeglądarce rozważ bezpieczne cookies HttpOnly zależnie od architektury.",
                        "String token = Jwts.builder()\n        .subject(userId.toString())\n        .issuedAt(Date.from(now))\n        .expiration(Date.from(now.plusSeconds(900)))\n        .signWith(secretKey)\n        .compact();",
                        "Wypisz trzy obowiązkowe kontrole tokenu JWT: podpis, data wygaśnięcia i oczekiwany issuer.",
                        "podpis\ndata wygaśnięcia\noczekiwany issuer",
                        "Czy zawartość JWT jest domyślnie zaszyfrowana?",
                        "Nie", "Tak", "Tylko subject", "Tylko expiration", "text"),

                m(39, "Role ADMIN i USER",
                        "Role grupują uprawnienia, ale decyzje dostępu powinny wynikać z zasady najmniejszego uprawnienia. Ochrona w kontrolerze nie wystarcza, gdy reguła zależy od właściciela zasobu.\n\n"
                                + "@PreAuthorize pozwala chronić metody, a serwis powinien dodatkowo sprawdzić relacje domenowe. Nigdy nie ufaj roli przesłanej przez klienta podczas rejestracji.",
                        "@PreAuthorize(\"hasRole('ADMIN')\")\n@DeleteMapping(\"/{id}\")\nvoid delete(@PathVariable long id) {\n    service.delete(id);\n}",
                        "Dodaj @PreAuthorize do metody publish(), aby dostęp miały role ADMIN lub EDITOR.",
                        "@PreAuthorize(\"hasAnyRole('ADMIN', 'EDITOR')\")\nvoid publish() {\n}",
                        "Kto powinien nadawać rolę ADMIN?",
                        "Zaufany proces administracyjny po stronie serwera", "Formularz rejestracji użytkownika", "Dowolny request", "Kod JavaScript klienta", "java"),

                m(40, "Dokumentacja OpenAPI i Swagger UI",
                        "OpenAPI jest maszynowym kontraktem HTTP, a Swagger UI wizualizuje go i pozwala wykonywać żądania. Dokumentuj statusy, schematy, walidację, autoryzację i przykłady.\n\n"
                                + "Dokumentacja musi odpowiadać rzeczywistości. Generuj ją z kodu, weryfikuj w testach i nie traktuj jako zamiennika dobrych nazw DTO oraz endpointów.",
                        "@Operation(summary = \"Pobiera zadanie po identyfikatorze\")\n@ApiResponses({\n    @ApiResponse(responseCode = \"200\", description = \"Znaleziono\"),\n    @ApiResponse(responseCode = \"404\", description = \"Brak zadania\")\n})\n@GetMapping(\"/{id}\")\nTaskResponse get(@PathVariable long id) { return service.get(id); }",
                        "Dodaj @Operation z summary Tworzy kurs nad metodą kontrolera create().",
                        "@Operation(summary = \"Tworzy kurs\")\nCourseResponse create() {\n}",
                        "Co opisuje specyfikacja OpenAPI?",
                        "Kontrakt HTTP API", "Schemat tabel wyłącznie", "Historię Git", "Obraz Dockera", "java"),

                m(41, "Docker i powtarzalne środowisko",
                        "Obraz jest niezmiennym pakietem aplikacji, kontener uruchomionym egzemplarzem, a volume przechowuje dane poza kontenerem. Dockerfile buduje obraz warstwami.\n\n"
                                + "Używaj obrazu JRE dopasowanego do wersji Javy, użytkownika bez roota, małego kontekstu przez .dockerignore i wieloetapowego builda. Sekretów nie zapisuj w obrazie.",
                        "FROM eclipse-temurin:25-jre\nWORKDIR /app\nCOPY target/app.jar app.jar\nUSER 10001\nEXPOSE 8080\nENTRYPOINT [\"java\", \"-jar\", \"app.jar\"]",
                        "Zapisz dwa polecenia: zbuduj obraz task-api z tagiem 1.0 i uruchom go mapując port 8080.",
                        "docker build -t task-api:1.0 .\ndocker run --rm -p 8080:8080 task-api:1.0",
                        "Czym jest kontener?",
                        "Uruchomionym egzemplarzem obrazu", "Plikiem pom.xml", "Repozytorium Git", "Maszyną wirtualną zawsze z własnym jądrem", "shell"),

                m(42, "Projekt 1: aplikacja konsolowa",
                        "Pierwszy projekt scala typy, warunki, pętle, metody, kolekcje i pliki. Zbuduj Study Tracker CLI: dodawanie sesji, listowanie, suma minut, zapis i odczyt CSV.\n\n"
                                + "Podziel kod na model StudySession, serwis StudyService, repozytorium FileStudyRepository i warstwę menu. Kryterium ukończenia: aplikacja przeżywa restart, waliduje wejście i ma testy serwisu.",
                        "record StudySession(LocalDate date, String topic, int minutes) {}\n\ninterface StudyRepository {\n    List<StudySession> findAll();\n    void saveAll(List<StudySession> sessions);\n}",
                        "Zdefiniuj record StudySession z polami LocalDate date, String topic i int minutes oraz metodą valid zwracającą true dla niepustego topic i minutes > 0.",
                        "record StudySession(LocalDate date, String topic, int minutes) {\n    boolean valid() {\n        return topic != null && !topic.isBlank() && minutes > 0;\n    }\n}",
                        "Która warstwa powinna obsługiwać zapis CSV?",
                        "Implementacja repozytorium", "Record domenowy", "Metoda main wyłącznie", "Enum statusu", "java"),

                m(43, "Projekt 2: system zadań",
                        "Zbuduj Task Manager jako projekt Maven z architekturą warstwową. Zadanie ma id, tytuł, opis, priorytet, termin i status. Użytkownik może filtrować, sortować i oznaczać wykonanie.\n\n"
                                + "Najpierw implementuj repozytorium w pamięci i testy, potem zapis plikowy. Wprowadź interfejs TaskRepository, aby warstwa serwisowa nie zależała od sposobu przechowywania.",
                        "final class TaskService {\n    private final TaskRepository repository;\n\n    TaskService(TaskRepository repository) {\n        this.repository = repository;\n    }\n\n    Task complete(long id) {\n        Task task = repository.findById(id).orElseThrow();\n        return repository.save(task.complete());\n    }\n}",
                        "Utwórz interfejs TaskRepository z metodami Optional<Task> findById(long id) i Task save(Task task).",
                        "interface TaskRepository {\n    Optional<Task> findById(long id);\n    Task save(Task task);\n}",
                        "Dlaczego serwis zależy od interfejsu repozytorium?",
                        "Można wymieniać implementacje i łatwo testować", "Aby uniknąć konstruktora", "Aby nie używać kolekcji", "Bo JDK tego wymaga", "java"),

                m(44, "Projekt 3: REST API",
                        "Przekształć Task Manager w Spring Boot REST API. Dodaj CRUD, paginację, filtrowanie po statusie, DTO, walidację, obsługę błędów, OpenAPI i testy warstwy web.\n\n"
                                + "Kontrakt powinien używać poprawnych statusów: 201 z Location po utworzeniu, 200 przy odczycie, 204 po usunięciu, 400 dla walidacji i 404 dla braku zasobu.",
                        "@PostMapping\nResponseEntity<TaskResponse> create(@Valid @RequestBody CreateTaskRequest request) {\n    TaskResponse created = service.create(request);\n    URI location = URI.create(\"/api/tasks/\" + created.id());\n    return ResponseEntity.created(location).body(created);\n}",
                        "Zaimplementuj endpoint DELETE /{id}, który wywołuje service.delete(id) i zwraca ResponseEntity.noContent().build().",
                        "@DeleteMapping(\"/{id}\")\nResponseEntity<Void> delete(@PathVariable long id) {\n    service.delete(id);\n    return ResponseEntity.noContent().build();\n}",
                        "Jaki status powinien zwrócić poprawnie utworzony zasób?",
                        "201 Created", "204 No Content", "404 Not Found", "409 Conflict zawsze", "java"),

                m(45, "Projekt 4: logowanie i autoryzacja",
                        "Dodaj rejestrację, logowanie, bezpieczne hashowanie haseł, krótkotrwały access token JWT oraz role USER i ADMIN. Użytkownik widzi tylko własne zadania, administrator może moderować dane.\n\n"
                                + "Przygotuj testy: złe hasło daje 401, brak tokenu 401, cudzy zasób 403 lub 404 zgodnie z polityką, a endpoint administratora odrzuca USER.",
                        "@PreAuthorize(\"@taskAccess.isOwner(#id, authentication) or hasRole('ADMIN')\")\n@GetMapping(\"/{id}\")\nTaskResponse get(@PathVariable long id) {\n    return service.get(id);\n}",
                        "Dodaj do PasswordService metodę matches delegującą do passwordEncoder.matches(raw, encoded).",
                        "boolean matches(String raw, String encoded) {\n    return passwordEncoder.matches(raw, encoded);\n}",
                        "Jak należy przechowywać hasło?",
                        "Jako hash utworzony bezpiecznym algorytmem", "Jako jawny tekst", "W JWT", "W logach aplikacji", "java"),

                m(46, "Projekt końcowy: backend produkcyjny",
                        "Zbuduj EduTask — wieloużytkownikowy backend zarządzania projektami. Zakres: użytkownicy, zespoły, projekty, zadania, komentarze, role, audyt, wyszukiwanie, paginacja, PostgreSQL, migracje, testy i Docker Compose.\n\n"
                                + "Wymagaj README z decyzjami architektonicznymi, diagramu modelu, kolekcji requestów, CI wykonującego verify i instrukcji uruchomienia. Najważniejsza jest spójność i jakość, nie liczba endpointów.",
                        "services:\n  db:\n    image: postgres:18\n    environment:\n      POSTGRES_DB: edutask\n  api:\n    build: .\n    depends_on:\n      - db",
                        "Wypisz cztery elementy Definition of Done projektu: testy przechodzą, dokumentacja API działa, brak sekretów w Git, uruchomienie przez Docker Compose.",
                        "testy przechodzą\ndokumentacja API działa\nbrak sekretów w Git\nuruchomienie przez Docker Compose",
                        "Co powinno uruchamiać CI przed połączeniem pull requestu?",
                        "Pełny build i testy", "Tylko formatowanie README", "Ręczne kliknięcie aplikacji", "Usunięcie historii Git", "text"),

                m(47, "Produktywna praca w IntelliJ IDEA",
                        "IntelliJ ma pomagać rozumieć i zmieniać kod, nie zastępować myślenia. Opanuj nawigację do deklaracji i użyć, refaktoryzacje Rename/Extract Method, generowanie testów, debugger, terminal, Maven i klienta HTTP.\n\n"
                                + "Nie poprawiaj nazw przez zwykłe Find/Replace. Bezpieczna refaktoryzacja rozumie symbole. Regularnie używaj Inspect Code i ucz się skrótu Search Everywhere.",
                        "// Zaznacz wyrażenie i użyj Extract Method.\nboolean canPublish(User user, Course course) {\n    return user.isAdmin() && course.isComplete();\n}",
                        "Wypisz trzy bezpieczne operacje IntelliJ używane w pracy: Rename symbol, Extract Method, Find Usages.",
                        "Rename symbol\nExtract Method\nFind Usages",
                        "Która funkcja bezpiecznie zmienia nazwę symbolu we wszystkich użyciach?",
                        "Rename refactoring", "Find text", "Terminal clear", "Reformat File tylko", "text"),

                m(48, "Git workflow zespołu",
                        "Pracuj na krótkim branchu utworzonym z aktualnego main. Często synchronizuj bazę, twórz logiczne commity, wypchnij branch i otwórz pull request. Konflikt rozwiązuje autor, który rozumie własną zmianę.\n\n"
                                + "Pull request opisuje problem, rozwiązanie, sposób testowania i ryzyka. Squash przy scalaniu upraszcza historię, jeśli zespół tak ustalił.",
                        "git switch main\ngit pull --ff-only\ngit switch -c feature/task-filter\ngit add .\ngit commit -m \"Add task status filter\"\ngit push -u origin feature/task-filter",
                        "Zapisz polecenia tworzące branch feature/login z main i wypychające go z ustawieniem upstream.",
                        "git switch main\ngit pull --ff-only\ngit switch -c feature/login\ngit push -u origin feature/login",
                        "Jaki jest cel pull requestu?",
                        "Przegląd i bezpieczne połączenie zmiany", "Zastąpienie testów", "Przechowywanie haseł", "Kompilacja JDK", "shell"),

                m(49, "Code review i współpraca",
                        "Review sprawdza poprawność, bezpieczeństwo, testowalność i czytelność. Komentuj kod, nie autora, podawaj skutek i proponuj kierunek. Odróżniaj blokadę od sugestii.\n\n"
                                + "Autor powinien sam przejrzeć diff, opisać testy i odpowiadać rzeczowo. Małe pull requesty dostają lepszy review. Automatyzuj formatowanie i proste reguły.",
                        "Problem: metoda zwraca dane każdego użytkownika.\nSkutek: naruszenie autoryzacji.\nSugestia: filtruj po authenticatedUserId i dodaj test dostępu do cudzego zasobu.",
                        "Napisz komentarz review zawierający trzy części: problem, skutek i propozycję zmiany.",
                        "Problem: zapytanie pobiera całą tabelę.\nSkutek: rosnące zużycie pamięci.\nPropozycja: dodaj paginację przez Pageable.",
                        "Jaki komentarz review jest najbardziej użyteczny?",
                        "Opisuje problem, skutek i możliwy kierunek poprawy", "Tylko „źle”", "Atakuje autora", "Nie odnosi się do kodu", "text"),

                m(50, "Clean Code w praktyce",
                        "Czytelny kod ma nazwy opisujące intencję, krótkie funkcje na jednym poziomie abstrakcji i niewiele powodów do zmiany. Komentarz nie powinien tłumaczyć zagmatwanego kodu, który można nazwać.\n\n"
                                + "Unikaj magicznych liczb, boolean blindness, głębokich zagnieżdżeń i przedwczesnych abstrakcji. Najpierw zapewnij działanie testem, potem upraszczaj.",
                        "private static final int MIN_PASSWORD_LENGTH = 12;\n\nboolean hasValidPassword(String password) {\n    return password != null && password.length() >= MIN_PASSWORD_LENGTH;\n}",
                        "Zastąp warunek age >= 18 nazwanym predykatem isAdult(int age).",
                        "static boolean isAdult(int age) {\n    return age >= 18;\n}",
                        "Co powinna komunikować dobra nazwa metody?",
                        "Intencję wykonywanej operacji", "Numer linii", "Nazwę autora", "Typ IDE", "java"),

                m(51, "SOLID bez dogmatów",
                        "SRP ogranicza powody zmiany klasy. OCP zachęca do rozszerzania przez kontrakty. LSP wymaga wymienności implementacji. ISP promuje małe interfejsy. DIP kieruje zależności ku abstrakcjom.\n\n"
                                + "SOLID to narzędzia do redukcji kosztu zmian, nie obowiązek tworzenia interfejsu dla każdej klasy. Stosuj zasadę tam, gdzie rozwiązuje konkretny problem.",
                        "interface PaymentGateway {\n    PaymentResult charge(Money amount);\n}\n\nfinal class CheckoutService {\n    private final PaymentGateway gateway;\n\n    CheckoutService(PaymentGateway gateway) {\n        this.gateway = gateway;\n    }\n}",
                        "Wydziel interfejs MessageSender z metodą send(String message), aby NotificationService zależał od abstrakcji.",
                        "interface MessageSender {\n    void send(String message);\n}\n\nclass NotificationService {\n    private final MessageSender sender;\n\n    NotificationService(MessageSender sender) {\n        this.sender = sender;\n    }\n}",
                        "Która zasada mówi o zależności od abstrakcji?",
                        "DIP", "SRP", "LSP", "ISP", "java"),

                m(52, "Wzorce projektowe w kodzie aplikacji",
                        "Wzorzec to nazwana odpowiedź na powtarzalny problem. Strategy wymienia algorytm, Factory skupia tworzenie, Adapter dopasowuje API, Decorator dodaje zachowanie, a Observer reaguje na zdarzenia.\n\n"
                                + "Nie zaczynaj od wzorca. Najpierw rozpoznaj zmienność i koszt, a dopiero potem wybierz najprostsze rozwiązanie. Umiejętność wyjaśnienia kompromisu jest ważniejsza niż liczba użytych wzorców.",
                        "interface DiscountStrategy {\n    Money discount(Order order);\n}\n\nfinal class CheckoutService {\n    private final DiscountStrategy discountStrategy;\n\n    Money total(Order order) {\n        return order.total().minus(discountStrategy.discount(order));\n    }\n}",
                        "Zdefiniuj interfejs ExportStrategy z metodą export(Report report) zwracającą String.",
                        "interface ExportStrategy {\n    String export(Report report);\n}",
                        "Który wzorzec pozwala wymieniać algorytm przez wspólny kontrakt?",
                        "Strategy", "Singleton", "Builder", "Facade", "java")
        );
    }

    private static ModuleSpec m(
            int number,
            String focus,
            String theory,
            String exampleCode,
            String taskInstruction,
            String expectedAnswer,
            String quizQuestion,
            String quizAnswer,
            String wrongAnswerOne,
            String wrongAnswerTwo,
            String wrongAnswerThree,
            String language
    ) {
        return new ModuleSpec(
                number,
                focus,
                theory,
                exampleCode,
                taskInstruction,
                expectedAnswer,
                quizQuestion,
                List.of(quizAnswer, wrongAnswerOne, wrongAnswerTwo, wrongAnswerThree),
                quizAnswer,
                language
        );
    }
}

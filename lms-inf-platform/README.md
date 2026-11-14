# lms-inf-platform

## Render: uruchamianie na instancji 512 MiB

Obraz Docker domyślnie ustawia `JAVA_TOOL_OPTIONS` i dołącza profil `render`.
Nie trzeba zmieniać bazy danych ani importować ponownie istniejących lekcji.

- Sterta Javy: początkowo 64 MiB, maksymalnie 192 MiB.
- Metaspace: do 128 MiB; pamięć kodu JIT: do 32 MiB; bufory bezpośrednie: do 16 MiB.
- Stos wątku: 512 KiB; Serial GC; dwa procesory widoczne dla JVM.
- Tomcat: 2–16 wątków, do 128 połączeń i 16 buforowanych procesorów żądań.
- Hikari: 1 bezczynne połączenie, maksymalnie 4 połączenia z bazą.
- Przy braku pamięci JVM kończy proces, aby hosting mógł go zrestartować.

To budżet początkowy, nie gwarancja zużycia poniżej 512 MiB. JVM i biblioteki
zużywają również pamięć natywną. Mniejsza współbieżność może zwiększyć czas
oczekiwania przy dużej liczbie uczniów. Po wdrożeniu sprawdź zużycie pamięci
również podczas równoczesnej pracy klasy, a nie tylko zaraz po starcie.

### Wdrożenie i weryfikacja

1. Wyślij zmiany do repozytorium/gałęzi podłączonej do backendu w Render.
2. Sprawdź zmienne środowiskowe Render: istniejące `JAVA_TOOL_OPTIONS`
   nadpisuje cały zestaw z Dockerfile. Jeśli używasz tej zmiennej, połącz
   potrzebne dotychczasowe opcje z powyższymi limitami; nie usuwaj jej w ciemno.
   Sprawdź też, czy `JDK_JAVA_OPTIONS` lub własna komenda startowa nie ustawiają
   sprzecznych limitów. Jeśli masz własne `SPRING_PROFILES_INCLUDE`, dopisz
   do niego `render`. Dotychczasowe `SPRING_PROFILES_ACTIVE` może pozostać.
3. Wdróż najnowszy commit backendu (nie starą nieudaną wersję `5684373`).
4. W logach powinny pojawić się ograniczenia `JAVA_TOOL_OPTIONS`, profil
   `render`, a następnie `Started LmsInfPlatformApplication`. Sprawdź status `Live`.
5. Otwórz `/api/health`: oczekiwane `status: ok` oraz
   `version: 2026.09.23-language-import-memory`.
6. Ponów import 17 bloków lekcji „Hello!” w pustej lekcji językowej.
   Nie otwieraj adresu `/bulk` w nowej karcie — zapis korzysta z POST.

Nie zwiększaj `-Xmx` do całych 512 MiB: pozostałe obszary pamięci też muszą
zmieścić się w limicie kontenera. Jeśli po aktualizacji nadal występuje
`Out of memory`, zbierz aktualne logi i metryki; może być potrzebna większa
instancja. Nie osłabiaj zabezpieczeń ani sprawdzania zadań, aby oszczędzać RAM.

Dokumentacja ustawień:
[Java 24](https://docs.oracle.com/en/java/javase/24/docs/specs/man/java.html),
[Spring Boot](https://docs.spring.io/spring-boot/appendix/application-properties/).

## Izolowane testy Java na Render

Domyślnie pozostaje dostawca `docker`. Płatne wykonywanie w chmurze jest
**wyłączone**, dopóki administrator jawnie nie ustawi całej konfiguracji poniżej.
Samo wdrożenie kodu nie tworzy płatnych zasobów. Nie uruchamiamy kodu uczniów
bezpośrednio w procesie backendu ani przez porównanie ze wzorcem zamiast testów.

### Aktywacja na istniejącym koncie (wymaga połączenia Render)

1. Utwórz osobną grupę `eduhub-java-tests` w Oregonie; ustaw jej współbieżność na 1.
   Nie zmieniaj domyślnej grupy innych aplikacji.
2. Zaimportuj oficjalny obraz `eclipse-temurin:21-jdk-alpine`, przypięty do
   zweryfikowanego digestu **linux/amd64**, do tej grupy. Sprawdź status importu
   i wykonaj smoke test na świeżej VM z siecią `deny-all`. JDK musi być dostępne
   w `/opt/java/openjdk/bin`. Nie uruchamiaj wewnętrznego Dockera ani operacji
   `mount`: granicą izolacji jest jednorazowa microVM Firecracker.
3. Używaj ID przetestowanego obrazu `sbb-…`, nie ruchomego tagu. Aktualizację
   obrazu najpierw przetestuj, a potem jawnie podmień jego ID w konfiguracji.
   Nie potrzeba stale działającego serwera ani bazowego snapshotu runtime.
4. Ustaw jako zmienne **backendu**, nie frontendu:

   | Zmienna | Wartość |
   | --- | --- |
   | `CODE_RUNNER_PROVIDER` | `render` |
   | `CODE_RUNNER_ENABLED` | `true` |
   | `CODE_RUNNER_RENDER_APPROVED` | `true`, dopiero po akceptacji kosztów i smoke testu |
   | `CODE_RUNNER_RENDER_API_KEY` | sekret konta Render, nigdy w repozytorium ani czacie |
   | `CODE_RUNNER_RENDER_WORKSPACE_ID` | ID istniejącego workspace `tea-…` |
   | `CODE_RUNNER_RENDER_GROUP_ID` | ID dedykowanej grupy `sbg-…` |
   | `CODE_RUNNER_RENDER_IMAGE_ID` | ID przetestowanego obrazu JDK `sbb-…` |
   | `CODE_RUNNER_RENDER_MONTHLY_LAUNCH_LIMIT` | `1000` lub mniej |

5. Sprawdź faktyczne zadanie Java: poprawka `private` → `public` w metodzie
   `ApplicationInfo.getApplicationName()` ma przejść test `<brak> => EDUHUB API`,
   a niepoprawny kod ma zwrócić błąd kompilatora. Sprawdź też pętlę nieskończoną,
   nadmiarowy output i próbę dostępu do sieci.
6. Potwierdź w panelu Render zakończenie wszystkich testowych środowisk.
   Przed uruchomieniem dla uczniów sprawdź naliczone zużycie i alert budżetowy.

`RenderSandboxLiveTest` jest domyślnie pomijany. Wymaga jawnego
`EDUHUB_RUN_RENDER_SMOKE_TEST=true`, `RENDER_API_KEY`, `RENDER_WORKSPACE_ID`,
`EDUHUB_RENDER_GROUP_ID` i `EDUHUB_RENDER_IMAGE_ID`, przekazanych poza repozytorium.
Uruchomienie tej klasy tworzy 8 krótkotrwałych, płatnych VM i nie korzysta z
licznika aplikacji — używaj jej tylko przy świadomie zatwierdzonej weryfikacji.
Testuje poprawkę `private/public`, stdin, timeout, limit wyniku, brak dostępu
do publicznej sieci oraz świeży system plików dla każdego wejścia.

### Ograniczenia kosztów i bezpieczeństwa

- Najwyżej 1000 środowisk w miesiącu UTC, liczone trwale w tabeli
  `code_runner_budget`. Limit jest wspólny dla instancji aplikacji i odporny na
  restart. Konfiguracja nie może podnieść go ponad 1000. Brak bazy blokuje
  uruchomienie; błędy nie zwracają wykorzystanej rezerwacji.
- Każdy ukryty test dostaje **nową VM**, zamykaną przed następnym testem.
  Żaden proces ani plik ucznia nie przechodzi między testami lub osobami.
  Maksymalnie 8 testów na sprawdzenie: limit 1000 VM oznacza od 125 pełnych
  ośmiotestowych sprawdzeń do 1000 sprawdzeń z jednym testem. Oczekiwane wyniki
  pozostają na backendzie. Niepełne sprawdzenie przy wyczerpaniu limitu nie
  nalicza błędnej próby uczniowi.
- Zawsze `1c-2g`, maksymalny czas życia 60 sekund, `idleTimeoutSeconds: 0`
  (bez automatycznych snapshotów/suspend), sieć `deny-all`, bez sekretów w VM.
- Zamykanie w `finally`, także po awarii. Gdy API zamknięcia zawiedzie, pozostaje
  niezależny 60-sekundowy limit ustawiony po stronie Render. Tworzenie środowisk
  nie jest automatycznie ponawiane, aby nie dublować opłat.
- Brak instalowania pakietów, dostępu do sieci i kluczy aplikacji wewnątrz VM.
  Kompilacja ma limit 8 sekund i 192 MiB sterty; program 3 sekundy i 64 MiB
  sterty, z ograniczeniem metaspace i code cache. Cała VM ma niezależny limit
  60 sekund, 1 CPU i 2 GiB pamięci; wynik najwyżej 64 KiB.
- Brak obrazu lub poprawnej konfiguracji jest awarią usługi, nie błędem ucznia.
  Nie nalicza próby, nie obniża serii i nie ujawnia rozwiązania. Lokalny dostawca
  `docker` pozostaje dostępny do pracy developerskiej, ale nie zastępuje VM na Render.
- API używa TLS, nie śledzi przekierowań, ogranicza wielkość odpowiedzi i czas
  żądań. Główny klucz trafia tylko do API Render; wykonanie dostaje osobny,
  krótkotrwały token. Do logów nie trafiają klucze, kod ani ukryte dane testowe.

Cennik sprawdzony 14.11.2026: $0.12 za godzinę aktywnego CPU i $0.038 za godzinę
pamięci dla `1c-2g`. 1000 VM po pełne 60 sekund i 100% CPU to około
**$2.64 obliczeń**. Nie tworzymy snapshotów bazowych. Przy 10 sekundach na VM koszt 1000 uruchomień
wyniósłby około **$0.44 obliczeń** przy 100% CPU. To obliczenia na podstawie
stawek, nie gwarantowany rachunek: przygotowanie środowiska, transfer, podatki
i inne usługi konta rozliczane są osobno. Uzgodniony dodatkowy budżet wynosi
**do $5/miesiąc plus ewentualny podatek**. Licznik aplikacji nie jest limitem
wydatków całego konta Render. Nie podnoś parametrów ani limitu uruchomień bez
ponownej akceptacji; przy zmianie cennika ponownie przelicz limit.

[Cennik Render](https://render.com/pricing#sandboxes),
[Render Sandboxes — public beta](https://render.com/docs/sandboxes),
[Oficjalny SDK i protokół API](https://github.com/render-oss/sdk/tree/typescript/v1.8.0).

Gdy integracja nie jest dostępna, przycisk „Sprawdź” wyjaśnia awarię. Nie
oznacza poprawnego rozwiązania jako błędnego, ale również nie zalicza zadania
bez wykonania testów. Istniejących historycznych ocen nie zmieniamy automatycznie.

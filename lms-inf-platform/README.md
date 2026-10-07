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

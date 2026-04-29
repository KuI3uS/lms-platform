# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


Plan projektu LMS

Etap 1 — Uporządkowanie tego, co już masz

1. Naprawiamy submit testu.
2. Ustalamy jeden model: Course → Module → Question → Answer → Submission.
3. Usuwamy stare resztki Task tam, gdzie przeszkadzają.
4. Sprawdzamy, czy działa:
    * logowanie,
    * kursy,
    * moduły,
    * pytania,
    * odpowiedzi,
    * wynik procentowy.

Etap 2 — Wyniki ucznia

5. Dodajemy endpoint „moje wyniki”.
6. Pokazujemy wyniki na dashboardzie.
7. Uczeń widzi:
    * nazwę modułu,
    * wynik procentowy,
    * datę podejścia,
    * czy został zdyskwalifikowany.

Etap 3 — Pytania otwarte

8. Dodajemy typ pytania:
    * CLOSED — A/B/C/D,
    * OPEN — odpowiedź tekstowa.
9. Frontend pokazuje inne pole dla pytania otwartego.
10. Backend zapisuje odpowiedź otwartą.
11. Na początku pytania otwarte oznaczamy jako „do sprawdzenia ręcznie”.

Etap 4 — Zadania programistyczne

12. Dodajemy typ pytania:

* CODE.

13. Uczeń wpisuje kod Java / Python / SQL w polu tekstowym.
14. Na start nie uruchamiamy kodu automatycznie.
15. Nauczyciel może ręcznie sprawdzić odpowiedź.

Etap 5 — Panel nauczyciela / admina

16. Nauczyciel może dodawać kursy.
17. Nauczyciel może dodawać moduły.
18. Nauczyciel może dodawać pytania zamknięte.
19. Nauczyciel może dodawać pytania otwarte.
20. Nauczyciel może przeglądać wyniki uczniów.

Etap 6 — Klasy i uczniowie

21. Uczeń jest przypisany do klasy.
22. Kursy mogą być przypisane do klasy.
23. Uczeń widzi tylko swoje kursy.
24. Nauczyciel widzi wyniki swojej klasy.

Etap 7 — Rok nauki / plan materiału

25. Dodajemy klasy: 1, 2, 3, 4.
26. Dodajemy specjalizację, np. technik informatyk.
27. Tworzymy strukturę:

* klasa 1 → podstawy,
* klasa 2 → INF.02,
* klasa 3 → INF.03,
* klasa 4 → powtórki / egzamin.

28. Moduły układamy w kolejności.

Etap 8 — Anty-cheat

29. Liczymy przełączenia kart.
30. Po przekroczeniu limitu zapisujemy disqualified = true.
31. Wynik wtedy = 0%.
32. Później dodamy timer.

Etap 9 — UI / wygląd

33. Poprawiamy dashboard.
34. Robimy ekran kursów.
35. Robimy ekran modułów.
36. Robimy ekran quizu.
37. Robimy ekran wyniku.
38. Dodajemy podstawowe style.

Etap 10 — Deployment

39. GitHub — jedno repo z frontendem i backendem.
40. Backend deploy: Render / Railway.
41. Baza danych online: PostgreSQL / MySQL.
42. Frontend deploy: Vercel / Netlify.
43. Konfiguracja CORS pod domenę.
44. Test produkcyjny.

Kolejność pracy od teraz

Najpierw robimy tylko to:

1. Naprawiamy submit testu.
2. Wyświetlamy wynik po zakończeniu testu.
3. Dodajemy historię wyników ucznia.
4. Dopiero potem pytania otwarte.
package com.twojlogin.lms.service;

import com.twojlogin.lms.curriculum.JavaJuniorCurriculum;
import com.twojlogin.lms.curriculum.JavaJuniorCurriculum.ModuleSpec;
import com.twojlogin.lms.dto.CurriculumImportReport;
import com.twojlogin.lms.entity.BlockType;
import com.twojlogin.lms.entity.Course;
import com.twojlogin.lms.entity.CourseModule;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.repository.CourseModuleRepository;
import com.twojlogin.lms.repository.CourseRepository;
import com.twojlogin.lms.repository.LessonBlockRepository;
import com.twojlogin.lms.repository.LessonRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CurriculumImportService {

    private static final Pattern NUMBERED_MODULE = Pattern.compile("^\\s*(\\d{1,2})\\.");
    private static final int LESSONS_PER_MODULE = 2;
    private static final int BLOCKS_PER_MODULE = 10;

    private final CourseRepository courseRepository;
    private final CourseModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final LessonBlockRepository blockRepository;

    public CurriculumImportService(
            CourseRepository courseRepository,
            CourseModuleRepository moduleRepository,
            LessonRepository lessonRepository,
            LessonBlockRepository blockRepository
    ) {
        this.courseRepository = courseRepository;
        this.moduleRepository = moduleRepository;
        this.lessonRepository = lessonRepository;
        this.blockRepository = blockRepository;
    }

    @Transactional
    public CurriculumImportReport preview(Long courseId) {
        return prepare(courseId, false);
    }

    @Transactional
    public CurriculumImportReport importIntoEmptyModules(Long courseId) {
        return prepare(courseId, true);
    }

    private CurriculumImportReport prepare(Long courseId, boolean persist) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Kurs nie istnieje"
                ));

        Map<Integer, ModuleSpec> specs = new LinkedHashMap<>();
        JavaJuniorCurriculum.modules().forEach(spec -> specs.put(spec.number(), spec));

        List<CourseModule> modules =
                moduleRepository.findByCourseIdOrderByIdAsc(courseId);
        List<String> warnings = new ArrayList<>();
        int matched = 0;
        int ready = 0;
        int skipped = 0;
        int lessonsCreated = 0;
        int blocksCreated = 0;

        if (persist) {
            enrichCourseMetadata(course);
        }

        for (CourseModule module : modules) {
            Integer moduleNumber = readModuleNumber(module.getName());
            ModuleSpec spec = moduleNumber == null ? null : specs.get(moduleNumber);

            if (spec == null) {
                warnings.add("Pominięto moduł bez numeru 1-52: " + module.getName());
                continue;
            }

            matched++;
            if (lessonRepository.countByModuleId(module.getId()) > 0) {
                skipped++;
                continue;
            }

            ready++;
            if (!persist) {
                continue;
            }

            module.setLessonsLocked(true);
            moduleRepository.save(module);
            lessonsCreated += createLessons(module, spec);
            blocksCreated += BLOCKS_PER_MODULE;
        }

        if (matched < JavaJuniorCurriculum.modules().size()) {
            warnings.add(
                    "Rozpoznano " + matched + " z 52 etapów. Nazwa każdego etapu powinna zaczynać się od „1.” … „52.”."
            );
        }
        if (course.getTitle() == null || course.getTitle().isBlank()) {
            warnings.add("Kurs nie ma tytułu wyświetlanego; warto go uzupełnić przed publikacją.");
        }

        return new CurriculumImportReport(
                persist ? "IMPORT" : "PREVIEW",
                JavaJuniorCurriculum.NAME,
                JavaJuniorCurriculum.VERSION,
                courseId,
                matched,
                ready,
                skipped,
                persist ? lessonsCreated : ready * LESSONS_PER_MODULE,
                persist ? blocksCreated : ready * BLOCKS_PER_MODULE,
                List.copyOf(warnings)
        );
    }

    private void enrichCourseMetadata(Course course) {
        if (course.getDescription() == null || course.getDescription().isBlank()) {
            course.setDescription(
                    "Kompletna ścieżka od absolutnych podstaw do pierwszej pracy jako Junior Java Developer. "
                            + "52 etapy łączą Java 25 LTS, IntelliJ IDEA, Maven, testy, Git, SQL, Spring Boot, "
                            + "REST API, Security, JWT, Docker i pięć projektów do portfolio. "
                            + "Każdy etap zawiera teorię, kod, quiz oraz automatycznie sprawdzane laboratorium."
            );
        }
        if (course.getLevel() == null || course.getLevel().isBlank()
                || "Podstawy".equalsIgnoreCase(course.getLevel())) {
            course.setLevel("Od podstaw do Junior Java Developera");
        }
        if (course.getCategory() == null || course.getCategory().isBlank()) {
            course.setCategory("PROGRAMMING");
        }
        courseRepository.save(course);
    }

    private int createLessons(CourseModule module, ModuleSpec spec) {
        Lesson concept = lesson(
                module,
                0,
                "Zrozum: " + spec.focus(),
                spec.number() == 1
        );
        concept = lessonRepository.save(concept);
        blockRepository.saveAll(conceptBlocks(concept, spec));

        Lesson practice = lesson(
                module,
                1,
                "Przećwicz: " + spec.focus(),
                false
        );
        practice = lessonRepository.save(practice);
        blockRepository.saveAll(practiceBlocks(practice, spec));
        return LESSONS_PER_MODULE;
    }

    private Lesson lesson(
            CourseModule module,
            int orderIndex,
            String title,
            boolean freePreview
    ) {
        Lesson lesson = new Lesson();
        lesson.setModule(module);
        lesson.setOrderIndex(orderIndex);
        lesson.setTitle(title);
        lesson.setPublished(true);
        lesson.setFreePreview(freePreview);
        lesson.setContent("");
        lesson.setTheory("");
        lesson.setExample("");
        return lesson;
    }

    private List<LessonBlock> conceptBlocks(Lesson lesson, ModuleSpec spec) {
        return List.of(
                block(lesson, 0, BlockType.TEXT, "Po tej lekcji", learningGoals(spec)),
                block(lesson, 1, BlockType.TEXT, spec.focus(), spec.theory()),
                block(lesson, 2, BlockType.INFO, "Standard kursu 2026", technologyContext(spec.number())),
                example(lesson, 3, spec),
                quiz(lesson, 4, spec)
        );
    }

    private List<LessonBlock> practiceBlocks(Lesson lesson, ModuleSpec spec) {
        LessonBlock task = block(
                lesson,
                1,
                BlockType.TASK,
                "Ćwiczenie: " + spec.focus(),
                null
        );
        task.setDescription("Pracuj samodzielnie w edytorze, a następnie uruchom lub zweryfikuj rozwiązanie.");
        task.setInstruction(spec.taskInstruction());
        task.setStarterCode(starterCode(spec.language()));
        task.setExpectedAnswer(spec.expectedAnswer());
        task.setLanguage(spec.language());
        task.setHint("Rozbij polecenie na małe kroki i znajdź konstrukcję pokazaną w przykładzie.");
        task.setDetailedHint("Porównaj nazwy, kolejność operacji i wymagane elementy z poleceniem. Sprawdź też nawiasy oraz średniki.");
        task.setSolutionExplanation(
                "Rozwiązanie zawiera minimalny zestaw elementów wymaganych w poleceniu. "
                        + "Po uzyskaniu poprawnego wyniku zmień dane wejściowe i sprawdź, czy nadal działa."
        );
        task.setPoints(20);

        return List.of(
                block(lesson, 0, BlockType.TEXT, "Laboratorium w IntelliJ IDEA", practiceIntro(spec)),
                task,
                block(
                        lesson,
                        2,
                        BlockType.TIP,
                        "Pracuj jak programista",
                        "Najpierw uruchom najmniejszą działającą wersję. Potem wykonuj jedną zmianę naraz i po każdej sprawdzaj wynik. "
                                + "Przed przejściem dalej sformatuj kod i przeczytaj diff."
                ),
                block(
                        lesson,
                        3,
                        BlockType.WARNING,
                        "Nie ucz się przez bezmyślne kopiowanie",
                        "Przepisz rozwiązanie własnymi rękami, nazwij użyte elementy i wyjaśnij, dlaczego działają. "
                                + "Jeśli wynik jest poprawny tylko dla jednego przykładu, zadanie nie jest jeszcze skończone."
                ),
                block(lesson, 4, BlockType.SUMMARY, "Checklista ukończenia", summary(spec))
        );
    }

    private LessonBlock example(Lesson lesson, int order, ModuleSpec spec) {
        LessonBlock block = block(
                lesson,
                order,
                BlockType.EXAMPLE,
                "Przykład: " + spec.focus(),
                spec.exampleCode()
        );
        block.setDescription(
                "Przeczytaj kod od góry do dołu. Przed uruchomieniem przewidź rezultat, a potem zmień jedną wartość."
        );
        block.setLanguage(spec.language());
        return block;
    }

    private LessonBlock quiz(Lesson lesson, int order, ModuleSpec spec) {
        LessonBlock block = block(
                lesson,
                order,
                BlockType.QUIZ,
                spec.quizQuestion(),
                String.join("\n", spec.quizOptions())
        );
        block.setDescription("Wybierz jedną odpowiedź. Błąd jest sygnałem, aby wrócić do przykładu.");
        block.setExpectedAnswer(spec.quizAnswer());
        block.setHint("Odszukaj definicję lub regułę w części teoretycznej.");
        block.setDetailedHint("Odrzuć odpowiedzi, które dotyczą innego poziomu programu albo innego narzędzia.");
        block.setSolutionExplanation("Poprawna odpowiedź wynika bezpośrednio z kontraktu omawianej konstrukcji.");
        block.setPoints(5);
        return block;
    }

    private LessonBlock block(
            Lesson lesson,
            int orderIndex,
            BlockType type,
            String title,
            String content
    ) {
        LessonBlock block = new LessonBlock();
        block.setLesson(lesson);
        block.setOrderIndex(orderIndex);
        block.setType(type);
        block.setTitle(title);
        block.setContent(content);
        block.setPublished(true);
        block.setPoints(0);
        return block;
    }

    private String learningGoals(ModuleSpec spec) {
        return "Po ukończeniu potrafisz:\n"
                + "• wyjaśnić temat „" + spec.focus() + "” własnymi słowami,\n"
                + "• rozpoznać tę konstrukcję w istniejącym kodzie,\n"
                + "• samodzielnie wykonać małe zadanie i zweryfikować wynik,\n"
                + "• wskazać częsty błąd oraz sposób jego diagnozy.";
    }

    private String technologyContext(int number) {
        if (number <= 25) {
            return "Przykłady bazują na JDK 25 LTS i klasycznych plikach źródłowych, aby uczeń rozumiał pełną strukturę programu. "
                    + "Nowe skróty składni poznajemy dopiero po opanowaniu fundamentów.";
        }
        if (number <= 31) {
            return "Narzędzia: JDK 25 LTS, IntelliJ IDEA, Maven Wrapper, JUnit 5, Git oraz PostgreSQL. "
                    + "Każdy build ma działać zarówno w IDE, jak i z terminala.";
        }
        if (number <= 41) {
            return "Stos backendowy: Java 25 LTS, Spring Boot 4, Spring Security 7, Jakarta Persistence, PostgreSQL i Docker. "
                    + "Nie używamy javax.*, WebSecurityConfigurerAdapter ani innych wycofanych wzorców.";
        }
        if (number <= 46) {
            return "Projekt zapisuj w osobnym repozytorium Git i rozwijaj małymi przyrostami. Każdy etap kończy się działającym buildem, "
                    + "testami oraz krótkim wpisem w README opisującym uruchomienie.";
        }
        return "To kompetencja codziennej pracy Junior Java Developera. Ćwicz ją na projekcie końcowym, "
                + "a nie wyłącznie na odizolowanym przykładzie.";
    }

    private String practiceIntro(ModuleSpec spec) {
        return "Cel: zastosować „" + spec.focus() + "” bez kopiowania gotowego rozwiązania.\n\n"
                + "1. Utwórz branch ćwiczenia.\n"
                + "2. Przeczytaj polecenie i zapisz przewidywany wynik.\n"
                + "3. Uzupełnij kod, uruchom go i sprawdź co najmniej dwa przypadki.\n"
                + "4. Uporządkuj nazwy oraz formatowanie.\n"
                + "5. Zapisz mały commit opisujący efekt.";
    }

    private String summary(ModuleSpec spec) {
        return "Potrafię wyjaśnić: " + spec.focus() + "\n"
                + "Rozwiązanie przechodzi automatyczne sprawdzenie\n"
                + "Sprawdziłem dodatkowy przypadek lub inne dane\n"
                + "Kod ma czytelne nazwy i formatowanie\n"
                + "Umiem wskazać jedną rzecz, którą debugger lub test pomógł sprawdzić";
    }

    private String starterCode(String language) {
        return switch (language) {
            case "java" -> "public class Main {\n"
                    + "    public static void main(String[] args) {\n"
                    + "        // TODO: uzupełnij rozwiązanie\n"
                    + "    }\n"
                    + "}";
            case "sql" -> "-- TODO: napisz zapytanie SQL";
            case "xml" -> "<!-- TODO: uzupełnij konfigurację -->";
            case "shell" -> "# TODO: wpisz polecenia w kolejności";
            default -> "Wpisz odpowiedź tutaj";
        };
    }

    private Integer readModuleNumber(String name) {
        if (name == null) {
            return null;
        }
        Matcher matcher = NUMBERED_MODULE.matcher(name);
        if (!matcher.find()) {
            return null;
        }
        return Integer.parseInt(matcher.group(1));
    }
}

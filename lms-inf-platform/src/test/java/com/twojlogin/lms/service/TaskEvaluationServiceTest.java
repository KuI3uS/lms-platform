package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.TaskCheckResponse;
import com.twojlogin.lms.entity.BlockType;
import com.twojlogin.lms.entity.GamificationProfile;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.entity.TaskAttempt;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.LessonBlockRepository;
import com.twojlogin.lms.repository.TaskAttemptRepository;
import com.twojlogin.lms.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class TaskEvaluationServiceTest {

    private LessonBlockRepository blockRepository;
    private TaskAttemptRepository attemptRepository;
    private UserRepository userRepository;
    private GamificationService gamificationService;
    private Authentication authentication;
    private TaskEvaluationService service;
    private User user;
    private Lesson lesson;
    private LessonBlock block;

    private static final String EXPECTED = """
            public class Main {
                public static void main(String[] args) {
                    System.out.println("Witaj świecie");
                }
            }
            """;

    @BeforeEach
    void setUp() {
        blockRepository = mock(LessonBlockRepository.class);
        attemptRepository = mock(TaskAttemptRepository.class);
        userRepository = mock(UserRepository.class);
        gamificationService = mock(GamificationService.class);
        authentication = mock(Authentication.class);
        service = new TaskEvaluationService(
                blockRepository,
                attemptRepository,
                userRepository,
                gamificationService
        );

        user = new User();
        user.setId(7L);
        user.setEmail("uczen@example.com");

        GamificationProfile profile = new GamificationProfile();
        profile.setUser(user);
        profile.setLevel(1);
        when(gamificationService.profileForUpdate(user)).thenReturn(profile);
        when(gamificationService.recordTaskResult(
                any(GamificationProfile.class),
                any(LessonBlock.class),
                any(TaskAttempt.class),
                org.mockito.ArgumentMatchers.anyBoolean(),
                org.mockito.ArgumentMatchers.anyBoolean()
        )).thenReturn(new GamificationService.AwardResult(
                0,
                1,
                0,
                1,
                false,
                0,
                0,
                0
        ));

        lesson = new Lesson();
        lesson.setId(11L);

        block = new LessonBlock();
        block.setId(21L);
        block.setLesson(lesson);
        block.setType(BlockType.TASK);
        block.setPublished(true);
        block.setLanguage("java");
        block.setExpectedAnswer(EXPECTED);

        when(authentication.getName()).thenReturn(user.getEmail());
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(blockRepository.findById(block.getId())).thenReturn(Optional.of(block));
        when(blockRepository.countByLessonIdAndTypeAndPublishedTrue(lesson.getId(), BlockType.TASK))
                .thenReturn(1L);
        when(blockRepository.countRequiredAssessmentsByLessonId(lesson.getId()))
                .thenReturn(1L);
        when(attemptRepository.countCorrectTasksByUserAndLesson(user.getId(), lesson.getId()))
                .thenReturn(0L);
        when(attemptRepository.countCorrectAssessmentsByUserAndLesson(
                user.getId(),
                lesson.getId()
        )).thenReturn(0L);
        when(attemptRepository.save(any(TaskAttempt.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void reportsTheExactLineWhenJavaSemicolonIsMissing() {
        when(attemptRepository.findByUserAndBlock(user, block)).thenReturn(Optional.empty());

        String answer = """
                public class Main {
                    public static void main(String[] args) {
                        System.out.println("Witaj świecie")
                    }
                }
                """;

        TaskCheckResponse response = service.check(block.getId(), answer, authentication);

        assertFalse(response.correct());
        assertEquals(1, response.attemptCount());
        assertEquals(1, response.hintLevel());
        assertEquals("MISSING_SEMICOLON", response.diagnostics().get(0).type());
        assertEquals(3, response.diagnostics().get(0).line());
        assertTrue(response.diagnostics().get(0).message().contains("średnika"));
        assertEquals("Znaleziono 1 rzecz do poprawy.", response.message());
    }

    @Test
    void explainsInvalidJavaWithoutRevealingExpectedSolutionImmediately() {
        when(attemptRepository.findByUserAndBlock(user, block)).thenReturn(Optional.empty());

        String answer = """
                public class Main {
                    public static void main(String[] args) {
                        sdsd
                    }
                }
                """;

        TaskCheckResponse response = service.check(block.getId(), answer, authentication);

        assertFalse(response.correct());
        assertEquals(2, response.diagnostics().size());
        assertEquals("INVALID_JAVA_STATEMENT", response.diagnostics().get(0).type());
        assertEquals(3, response.diagnostics().get(0).line());
        assertEquals("MISSING_OUTPUT", response.diagnostics().get(1).type());
        assertFalse(response.message().contains("System.out.println"));
        assertTrue(response.diagnostics().stream()
                .noneMatch(diagnostic -> diagnostic.message().contains("Witaj świecie")));
    }

    @Test
    void increasesHelpAfterSecondAndFourthWrongAttempt() {
        TaskAttempt attempt = new TaskAttempt();
        when(attemptRepository.findByUserAndBlock(user, block)).thenReturn(Optional.of(attempt));

        String answer = EXPECTED.replace(";", "");

        service.check(block.getId(), answer, authentication);
        TaskCheckResponse second = service.check(block.getId(), answer, authentication);
        service.check(block.getId(), answer, authentication);
        TaskCheckResponse fourth = service.check(block.getId(), answer, authentication);

        assertEquals(2, second.hintLevel());
        assertNotNull(second.diagnostics().get(0).suggestion());
        assertEquals(3, fourth.hintLevel());
        assertEquals(EXPECTED, fourth.solutionPreview());
    }

    @Test
    void onlyCompletesTheCheckedTaskAndLeavesLessonCompletionToTheButton() {
        when(attemptRepository.findByUserAndBlock(user, block)).thenReturn(Optional.empty());

        TaskCheckResponse response = service.check(block.getId(), EXPECTED, authentication);

        assertTrue(response.correct());
        assertFalse(response.lessonCompleted());
    }

    @Test
    void checksQuizWithoutSendingTheCorrectAnswerToTheStudent() {
        block.setType(BlockType.QUIZ);
        block.setExpectedAnswer("int");
        block.setHint("Przypomnij sobie typy liczbowe.");
        when(attemptRepository.findByUserAndBlock(user, block))
                .thenReturn(Optional.empty());

        TaskCheckResponse response =
                service.check(block.getId(), "String", authentication);

        assertFalse(response.correct());
        assertEquals("INCORRECT_QUIZ_ANSWER", response.diagnostics().get(0).type());
        assertEquals("Przypomnij sobie typy liczbowe.", response.hint());
        assertFalse(response.message().contains("int"));
    }

    @Test
    void acceptsConfiguredLanguageAnswerVariantsIgnoringCaseAndFinalPunctuation() {
        block.setLanguage("");
        block.setStarterCode("");
        block.setExpectedAnswer("My name is Anna | I'm Anna");
        when(attemptRepository.findByUserAndBlock(user, block))
                .thenReturn(Optional.empty());

        TaskCheckResponse firstVariant = service.check(
                block.getId(),
                "  MY NAME IS ANNA!  ",
                authentication
        );
        TaskCheckResponse secondVariant = service.check(
                block.getId(),
                "I'm Anna.",
                authentication
        );

        assertTrue(firstVariant.correct());
        assertTrue(secondVariant.correct());
    }

    @Test
    void returnsAHelpfulDiagnosticForAnIncorrectLanguageAnswer() {
        block.setLanguage("");
        block.setStarterCode("");
        block.setExpectedAnswer("Good morning | Morning");
        when(attemptRepository.findByUserAndBlock(user, block))
                .thenReturn(Optional.empty());

        TaskCheckResponse response = service.check(
                block.getId(),
                "Good evening",
                authentication
        );

        assertFalse(response.correct());
        assertEquals("INCORRECT_TEXT_ANSWER", response.diagnostics().get(0).type());
    }

    @Test
    void rejectsAnUnchangedStarterTemplate() {
        String starter = """
                // Dane wejściowe:
                // Przetwarzanie:
                // Wynik:
                """;
        block.setStarterCode(starter);
        block.setExpectedAnswer("""
                // Dane wejściowe: login i hasło
                // Przetwarzanie: porównanie danych
                // Wynik: informacja o sukcesie albo błędzie
                """);
        when(attemptRepository.findByUserAndBlock(user, block))
                .thenReturn(Optional.empty());

        TaskCheckResponse response =
                service.check(block.getId(), starter, authentication);

        assertFalse(response.correct());
        assertEquals("UNCHANGED_STARTER", response.diagnostics().get(0).type());
    }

    @Test
    void requiresExactlyThreeCompletedCommentsForTheLoginProcessTask() {
        block.setStarterCode("");
        block.setExpectedAnswer("""
                // Dane wejściowe: login i hasło
                // Przetwarzanie: porównanie danych
                // Wynik: informacja o sukcesie albo błędzie
                """);
        when(attemptRepository.findByUserAndBlock(user, block))
                .thenReturn(Optional.empty());

        TaskCheckResponse correct = service.check(
                block.getId(),
                """
                // Dane wejściowe: adres e-mail i hasło użytkownika
                // Przetwarzanie: system porównuje dane z bazą
                // Wynik: użytkownik otrzymuje dostęp albo komunikat błędu
                """,
                authentication
        );
        TaskCheckResponse withExtraComment = service.check(
                block.getId(),
                """
                // Dane wejściowe: adres e-mail i hasło użytkownika
                // Przetwarzanie: system porównuje dane z bazą
                // Wynik: użytkownik otrzymuje dostęp albo komunikat błędu
                // Dodatkowo: zapis do pliku
                """,
                authentication
        );

        assertTrue(correct.correct());
        assertFalse(withExtraComment.correct());
        assertTrue(withExtraComment.diagnostics().stream().anyMatch(
                diagnostic -> diagnostic.type().equals("INCORRECT_COMMENT_COUNT")
        ));
    }
}

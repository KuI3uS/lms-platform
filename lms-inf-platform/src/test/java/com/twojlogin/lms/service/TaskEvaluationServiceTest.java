package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.TaskCheckResponse;
import com.twojlogin.lms.entity.BlockType;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.entity.LessonProgress;
import com.twojlogin.lms.entity.TaskAttempt;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.LessonBlockRepository;
import com.twojlogin.lms.repository.LessonProgressRepository;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TaskEvaluationServiceTest {

    private LessonBlockRepository blockRepository;
    private TaskAttemptRepository attemptRepository;
    private LessonProgressRepository progressRepository;
    private UserRepository userRepository;
    private ProgressRewardService rewardService;
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
        progressRepository = mock(LessonProgressRepository.class);
        userRepository = mock(UserRepository.class);
        rewardService = mock(ProgressRewardService.class);
        authentication = mock(Authentication.class);
        service = new TaskEvaluationService(
                blockRepository,
                attemptRepository,
                progressRepository,
                userRepository,
                rewardService
        );

        user = new User();
        user.setId(7L);
        user.setEmail("uczen@example.com");

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
    void completesLessonAfterAllPublishedTasksAreCorrect() {
        when(attemptRepository.findByUserAndBlock(user, block)).thenReturn(Optional.empty());
        when(attemptRepository.countCorrectAssessmentsByUserAndLesson(
                user.getId(),
                lesson.getId()
        ))
                .thenReturn(1L);
        when(progressRepository.findByUserAndLesson(user, lesson)).thenReturn(Optional.empty());

        TaskCheckResponse response = service.check(block.getId(), EXPECTED, authentication);

        assertTrue(response.correct());
        assertTrue(response.lessonCompleted());
        verify(progressRepository).save(any(LessonProgress.class));
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
}

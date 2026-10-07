package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.ExamAttemptDto;
import com.twojlogin.lms.dto.ExamStartRequest;
import com.twojlogin.lms.entity.*;
import com.twojlogin.lms.repository.ExamAttemptRepository;
import com.twojlogin.lms.repository.QuestionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ExamServiceTest {

    private ExamAttemptRepository attemptRepository;
    private QuestionRepository questionRepository;
    private CourseAccessService accessService;
    private LanguageProgressService languageProgressService;
    private ExamService service;
    private Authentication authentication;
    private User user;
    private Course course;

    @BeforeEach
    void setUp() {
        attemptRepository = mock(ExamAttemptRepository.class);
        questionRepository = mock(QuestionRepository.class);
        accessService = mock(CourseAccessService.class);
        languageProgressService = mock(LanguageProgressService.class);
        authentication = mock(Authentication.class);
        service = new ExamService(
                attemptRepository,
                questionRepository,
                accessService,
                mock(NotificationService.class),
                mock(AchievementService.class),
                languageProgressService,
                mock(CertificateService.class)
        );

        user = new User();
        user.setId(5L);
        user.setRole(Role.STUDENT);

        course = new Course();
        course.setId(9L);
        course.setName("INF.03");
        course.setPublished(true);

        when(accessService.currentUser(authentication)).thenReturn(user);
        when(accessService.requireCourseAccess(course.getId(), authentication)).thenReturn(course);
        when(attemptRepository.save(any(ExamAttempt.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void placementExamUsesOnlyQuestionsFromRequestedCefrLevel() {
        course.setCategory("LANGUAGE");
        course.setCefrLevel("A1");
        course.setCefrEndLevel("C2");
        List<Question> b1Questions = java.util.stream.LongStream.rangeClosed(1, 10)
                .mapToObj(id -> question(id, "B1 pytanie " + id))
                .toList();

        when(languageProgressService.isLanguageCourse(course)).thenReturn(true);
        when(languageProgressService.startLevel(course)).thenReturn("A1");
        when(languageProgressService.endLevel(course)).thenReturn("C2");
        when(languageProgressService.unlockedLevel(user, course)).thenReturn("A1");
        when(languageProgressService.questionsForLevel(course, "B1")).thenReturn(b1Questions);

        ExamAttemptDto attempt = service.start(
                new ExamStartRequest(course.getId(), 20, 40, ExamType.PLACEMENT, "B1"),
                authentication
        );

        assertEquals(ExamType.PLACEMENT, attempt.examType());
        assertEquals("B1", attempt.cefrLevel());
        assertEquals(10, attempt.totalQuestions());
    }

    @Test
    void startsTimedExamAndCapsQuestionCountToAvailablePool() {
        Question first = question(1L, "Pytanie 1");
        Question second = question(2L, "Pytanie 2");
        when(questionRepository.findByModuleCourseId(course.getId()))
                .thenReturn(List.of(first, second));

        ExamAttemptDto attempt = service.start(
                new ExamStartRequest(course.getId(), 20, 40),
                authentication
        );

        assertEquals(2, attempt.totalQuestions());
        assertEquals(2, attempt.questions().size());
        assertEquals(40, attempt.durationMinutes());
        assertEquals(ExamAttemptStatus.IN_PROGRESS, attempt.status());
        assertFalse(attempt.expiresAt().isBefore(attempt.startedAt()));
    }

    private Question question(Long id, String content) {
        Question question = new Question();
        question.setId(id);
        question.setContent(content);

        Answer answer = new Answer();
        answer.setContent("Odpowiedź");
        answer.setQuestion(question);
        question.setAnswers(List.of(answer));
        return question;
    }
}

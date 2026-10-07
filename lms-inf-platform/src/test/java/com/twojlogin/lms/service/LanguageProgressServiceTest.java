package com.twojlogin.lms.service;

import com.twojlogin.lms.entity.Course;
import com.twojlogin.lms.entity.ExamAttempt;
import com.twojlogin.lms.entity.ExamAttemptStatus;
import com.twojlogin.lms.entity.ExamType;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.ExamAttemptRepository;
import com.twojlogin.lms.repository.LessonProgressRepository;
import com.twojlogin.lms.repository.LessonRepository;
import com.twojlogin.lms.repository.QuestionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LanguageProgressServiceTest {

    private ExamAttemptRepository attemptRepository;
    private LanguageProgressService service;
    private User user;
    private Course course;

    @BeforeEach
    void setUp() {
        attemptRepository = mock(ExamAttemptRepository.class);
        service = new LanguageProgressService(
                attemptRepository,
                mock(LessonRepository.class),
                mock(LessonProgressRepository.class),
                mock(QuestionRepository.class)
        );

        user = new User();
        user.setId(7L);
        course = new Course();
        course.setId(11L);
        course.setCategory("LANGUAGE");
        course.setCefrLevel("A1");
        course.setCefrEndLevel("C2");
    }

    @Test
    void placementExamUnlocksSelectedLevelWithoutStartingAtA1() {
        ExamAttempt placement = passedAttempt(ExamType.PLACEMENT, "B1");
        when(attemptRepository
                .findByUserIdAndCourseIdAndStatusAndPassedTrueOrderByStartedAtDesc(
                        user.getId(), course.getId(), ExamAttemptStatus.SUBMITTED
                ))
                .thenReturn(List.of(placement));

        assertEquals("B1", service.unlockedLevel(user, course));
    }

    @Test
    void finalExamUnlocksNextCefrLevel() {
        ExamAttempt finalExam = passedAttempt(ExamType.LEVEL_FINAL, "B1");
        when(attemptRepository
                .findByUserIdAndCourseIdAndStatusAndPassedTrueOrderByStartedAtDesc(
                        user.getId(), course.getId(), ExamAttemptStatus.SUBMITTED
                ))
                .thenReturn(List.of(finalExam));

        assertEquals("B2", service.unlockedLevel(user, course));
    }

    private ExamAttempt passedAttempt(ExamType type, String level) {
        ExamAttempt attempt = new ExamAttempt();
        attempt.setExamType(type);
        attempt.setCefrLevel(level);
        attempt.setStatus(ExamAttemptStatus.SUBMITTED);
        attempt.setPassed(true);
        return attempt;
    }
}

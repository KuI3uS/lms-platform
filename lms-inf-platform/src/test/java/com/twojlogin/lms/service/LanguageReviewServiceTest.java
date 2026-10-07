package com.twojlogin.lms.service;

import com.twojlogin.lms.entity.Course;
import com.twojlogin.lms.entity.CourseModule;
import com.twojlogin.lms.entity.LanguageReviewProgress;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.LanguageReviewProgressRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class LanguageReviewServiceTest {

    private final Instant now = Instant.parse("2026-08-14T10:00:00Z");
    private LanguageReviewProgressRepository repository;
    private LanguageReviewService service;
    private User user;
    private LessonBlock block;

    @BeforeEach
    void setUp() {
        repository = mock(LanguageReviewProgressRepository.class);
        service = new LanguageReviewService(
                repository,
                Clock.fixed(now, ZoneOffset.UTC)
        );
        user = new User();
        user.setId(7L);
        block = languageBlock();
        when(repository.findByUserAndBlock(user, block)).thenReturn(Optional.empty());
        when(repository.save(any(LanguageReviewProgress.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void difficultPhraseReturnsAfterTenMinutes() {
        var result = service.record(user, block, 40);

        assertEquals(now.plusSeconds(600), result.dueAt());
        assertEquals(0, result.repetitions());
    }

    @Test
    void masteredPhraseStartsWithOneDayInterval() {
        var result = service.record(user, block, 96);

        assertEquals(now.plusSeconds(86_400), result.dueAt());
        assertEquals(1, result.repetitions());
    }

    private LessonBlock languageBlock() {
        Course course = new Course();
        course.setCategory("LANGUAGE");
        CourseModule module = new CourseModule();
        module.setCourse(course);
        Lesson lesson = new Lesson();
        lesson.setId(3L);
        lesson.setTitle("Powitania");
        lesson.setModule(module);
        LessonBlock lessonBlock = new LessonBlock();
        lessonBlock.setId(5L);
        lessonBlock.setTitle("Good morning");
        lessonBlock.setContent("Good morning");
        lessonBlock.setLesson(lesson);
        return lessonBlock;
    }
}

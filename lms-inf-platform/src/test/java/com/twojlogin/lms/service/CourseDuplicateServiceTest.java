package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.CourseDuplicatePreview;
import com.twojlogin.lms.entity.*;
import com.twojlogin.lms.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest(showSql = false)
@Import(CourseDuplicateService.class)
class CourseDuplicateServiceTest {
    @Autowired CourseDuplicateService service;
    @Autowired CourseRepository courses;
    @Autowired CourseModuleRepository modules;
    @Autowired LessonRepository lessons;
    @Autowired LessonBlockRepository blocks;
    @Autowired LessonProgressRepository progress;
    @Autowired UserRepository users;
    @Autowired QuestionRepository questions;
    @Autowired TaskAttemptRepository attempts;
    @Autowired LessonSubmissionRepository submissions;
    @Autowired LanguageReviewProgressRepository reviews;

    @Test
    void previewsAndRemovesRepeatedModulesAndLessonsWithoutTouchingAnotherCourseOrHeading() {
        Course course = course("Java");
        CourseModule original = module(course, "Podstawy", null);
        Lesson kept = lesson(original, "Wstęp", 1);
        lesson(original, "  WSTĘP  ", 2);
        Lesson next = lesson(original, "Zmienne", 3);
        CourseModule copy = module(course, "podstawy", null);
        lesson(copy, "Wstęp", 1);
        lesson(copy, "Zmienne", 2);
        CourseModule differentHeading = module(course, "Podstawy", "CZĘŚĆ II");
        lesson(differentHeading, "Wstęp", 1);
        lesson(differentHeading, "Zmienne", 2);
        Course other = course("Inny kurs");
        lesson(module(other, "Podstawy", null), "Wstęp", 1);

        CourseDuplicatePreview preview = service.preview(course.getId());
        assertEquals(1, preview.modulesToDelete());
        assertEquals(3, preview.lessonsToDelete());
        assertEquals(7, lessons.countByModuleCourseId(course.getId()));
        assertTrue(modules.existsById(copy.getId()));

        service.cleanup(course.getId(), preview.version());
        assertEquals(2, modules.countByCourseId(course.getId()));
        assertEquals(4, lessons.countByModuleCourseId(course.getId()));
        assertTrue(lessons.existsById(kept.getId()));
        assertFalse(modules.existsById(copy.getId()));
        assertEquals(1, lessons.countByModuleCourseId(other.getId()));
        assertEquals(2, lessons.findById(next.getId()).orElseThrow().getOrderIndex());
        assertEquals(0, service.preview(course.getId()).lessonsToDelete());
    }

    @Test
    void comparesFullBlockContentAndSettingsInsteadOfJustTitles() {
        Course course = course("Java");
        CourseModule module = module(course, "Podstawy", null);
        Lesson first = lesson(module, "Pytanie", 1);
        Lesson exactCopy = lesson(module, "Pytanie", 2);
        Lesson differentAnswer = lesson(module, "Pytanie", 3);
        Lesson differentPublication = lesson(module, "Pytanie", 4);
        differentPublication.setPublished(true);
        block(first, "A");
        block(exactCopy, "A");
        block(differentAnswer, "B");
        block(differentPublication, "A");
        lessons.flush();

        CourseDuplicatePreview preview = service.preview(course.getId());
        assertEquals(1, preview.lessonsToDelete());
        service.cleanup(course.getId(), preview.version());
        assertEquals(3, lessons.countByModuleId(module.getId()));
        assertEquals(0, blocks.countByLessonId(exactCopy.getId()));
        assertEquals(1, blocks.countByLessonId(first.getId()));
        assertTrue(lessons.existsById(differentAnswer.getId()));
        assertTrue(lessons.existsById(differentPublication.getId()));
    }

    @Test
    void preservesEveryKindOfStudentActivityEvenWhenSeveralCopiesWereUsed() {
        Course course = course("Java");
        CourseModule module = module(course, "Podstawy", null);
        User user = new User();
        user.setEmail("duplicate-test@example.com");
        user.setPassword("test-password");
        user.setRole(Role.STUDENT);
        user = users.save(user);
        Lesson unused = lesson(module, "Temat", 1);
        block(unused, "A");
        Lesson withProgress = lesson(module, "Temat", 2);
        block(withProgress, "A");
        LessonProgress record = new LessonProgress();
        record.setUser(user);
        record.setLesson(withProgress);
        progress.save(record);
        Lesson withSubmission = lesson(module, "Temat", 3);
        block(withSubmission, "A");
        LessonSubmission submission = new LessonSubmission();
        submission.setUser(user);
        submission.setLesson(withSubmission);
        submissions.save(submission);
        Lesson withAttempt = lesson(module, "Temat", 4);
        TaskAttempt attempt = new TaskAttempt();
        attempt.setUser(user);
        attempt.setBlock(block(withAttempt, "A"));
        attempts.save(attempt);
        Lesson withReview = lesson(module, "Temat", 5);
        LanguageReviewProgress review = new LanguageReviewProgress();
        review.setUser(user);
        review.setBlock(block(withReview, "A"));
        review.setNextReviewAt(java.time.Instant.now());
        reviews.save(review);
        lessons.flush();

        CourseDuplicatePreview preview = service.preview(course.getId());
        assertEquals(1, preview.lessonsToDelete());
        assertEquals(3, preview.protectedCopies());
        service.cleanup(course.getId(), preview.version());
        assertFalse(lessons.existsById(unused.getId()));
        assertEquals(4, lessons.countByModuleId(module.getId()));
        assertEquals(1, progress.count());
        assertEquals(1, submissions.count());
        assertEquals(1, attempts.count());
        assertEquals(1, reviews.count());
    }

    @Test
    void protectsExamQuestionsInRepeatedModules() {
        Course course = course("Java");
        CourseModule first = module(course, "Etap", null);
        CourseModule second = module(course, "Etap", null);
        for (CourseModule module : List.of(first, second)) {
            Question question = new Question();
            question.setContent("Pytanie");
            question.setModule(module);
            questions.save(question);
        }
        CourseDuplicatePreview preview = service.preview(course.getId());
        assertEquals(0, preview.modulesToDelete());
        assertEquals(1, preview.protectedCopies());
        service.cleanup(course.getId(), preview.version());
        assertEquals(2, modules.countByCourseId(course.getId()));
        assertEquals(2, questions.count());
    }

    @Test
    void rejectsAnOutdatedPreviewWhenContentChanges() {
        Course course = course("Java");
        CourseModule module = module(course, "Etap", null);
        lesson(module, "Temat", 1);
        Lesson copy = lesson(module, "Temat", 2);
        CourseDuplicatePreview preview = service.preview(course.getId());
        copy.setContent("Nowy materiał");
        lessons.flush();
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.cleanup(course.getId(), preview.version()));
        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        assertEquals(2, lessons.countByModuleId(module.getId()));
    }

    @Test
    void refusesDeletionIfAStudentStartsUsingACopyAfterThePreview() {
        Course course = course("Java");
        CourseModule module = module(course, "Etap", null);
        lesson(module, "Temat", 1);
        Lesson copy = lesson(module, "Temat", 2);
        CourseDuplicatePreview preview = service.preview(course.getId());
        User user = new User();
        user.setEmail("active-test@example.com");
        user.setPassword("test-password");
        user.setRole(Role.STUDENT);
        user = users.save(user);
        LessonProgress record = new LessonProgress();
        record.setUser(user);
        record.setLesson(copy);
        progress.saveAndFlush(record);
        assertThrows(ResponseStatusException.class,
                () -> service.cleanup(course.getId(), preview.version()));
        assertEquals(2, lessons.countByModuleId(module.getId()));
        assertEquals(1, progress.count());
    }

    @Test
    void handlesMoreThanTwoThousandDuplicatesInBatchesAndIsSafeToRetry() {
        Course course = course("Duży kurs");
        CourseModule module = module(course, "Etap", null);
        List<Lesson> copies = new ArrayList<>();
        for (int index = 1; index <= 2101; index++) {
            Lesson lesson = new Lesson();
            lesson.setModule(module);
            lesson.setTitle("Powtórzona lekcja");
            lesson.setOrderIndex(index);
            copies.add(lesson);
        }
        lessons.saveAllAndFlush(copies);
        CourseDuplicatePreview preview = service.preview(course.getId());
        assertEquals(2100, preview.lessonsToDelete());
        service.cleanup(course.getId(), preview.version());
        assertEquals(1, lessons.countByModuleId(module.getId()));
        assertThrows(ResponseStatusException.class,
                () -> service.cleanup(course.getId(), preview.version()));
        assertEquals(1, lessons.countByModuleId(module.getId()));
    }

    private Course course(String name) {
        Course course = new Course();
        course.setName(name);
        return courses.save(course);
    }

    private CourseModule module(Course course, String name, String heading) {
        CourseModule module = new CourseModule();
        module.setCourse(course);
        module.setName(name);
        module.setSectionTitle(heading);
        return modules.save(module);
    }

    private Lesson lesson(CourseModule module, String title, int order) {
        Lesson lesson = new Lesson();
        lesson.setModule(module);
        lesson.setTitle(title);
        lesson.setOrderIndex(order);
        return lessons.save(lesson);
    }

    private LessonBlock block(Lesson lesson, String answer) {
        LessonBlock block = new LessonBlock();
        block.setLesson(lesson);
        block.setType(BlockType.QUIZ);
        block.setTitle("Pytanie");
        block.setExpectedAnswer(answer);
        return blocks.saveAndFlush(block);
    }
}

package com.twojlogin.lms.service;

import com.twojlogin.lms.entity.*;
import com.twojlogin.lms.repository.*;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@Import({JavaCoursePublicationRepair.class, CourseAccessService.class, PublicCourseOfferService.class})
class JavaCoursePublicationRepairTest {
    @Autowired JavaCoursePublicationRepair repair;
    @Autowired CourseAccessService access;
    @Autowired PublicCourseOfferService offers;
    @Autowired CourseRepository courses;
    @Autowired CourseModuleRepository modules;
    @Autowired LessonRepository lessons;
    @Autowired LessonBlockRepository blocks;
    @Autowired UserRepository users;
    @Autowired CourseEnrollmentRepository enrollments;
    @Autowired EntityManager entityManager;
    @MockitoBean LanguageProgressService language;

    @Test
    void repairsOnlyJavaLessonsWithPublishedMaterialsOnceAndPreservesLaterUnpublishing() {
        Course java = course("Java Backend Developer", true);
        Lesson ready = lesson(java, BlockType.TEXT, true);
        Lesson empty = lesson(java, null, false);
        Lesson hidden = lesson(java, BlockType.TEXT, false);
        Lesson dividerOnly = lesson(java, BlockType.DIVIDER, true);
        Lesson otherCourse = lesson(course("SQL", true), BlockType.TEXT, true);
        Lesson unpublishedCourse = lesson(course("Java Backend Developer", false), BlockType.TEXT, true);

        assertEquals(1, repair.repairOnce());
        entityManager.clear();
        assertTrue(lessons.findById(ready.getId()).orElseThrow().isPublished());
        for (Lesson untouched : new Lesson[]{empty, hidden, dividerOnly, otherCourse, unpublishedCourse}) {
            assertFalse(lessons.findById(untouched.getId()).orElseThrow().isPublished());
        }
        assertEquals(1, offers.javaBackendOffer().availableLessonCount());

        Lesson manuallyHidden = lessons.findById(ready.getId()).orElseThrow();
        manuallyHidden.setPublished(false);
        lessons.saveAndFlush(manuallyHidden);
        assertEquals(0, repair.repairOnce());
        entityManager.clear();
        assertFalse(lessons.findById(ready.getId()).orElseThrow().isPublished());
    }

    @Test
    void repairedLessonIsAccessibleWithPaidEnrollmentButNotWithoutOrAfterExpiry() {
        Course java = course("Java Backend Developer", true);
        Lesson ready = lesson(java, BlockType.TEXT, true);
        User student = new User();
        student.setEmail("publication-test@example.invalid");
        student.setPassword("test-only");
        student.setRole(Role.STUDENT);
        student = users.saveAndFlush(student);
        repair.repairOnce();
        entityManager.clear();
        Lesson published = lessons.findById(ready.getId()).orElseThrow();
        User buyer = users.findById(student.getId()).orElseThrow();

        assertEquals(HttpStatus.PAYMENT_REQUIRED,
                assertThrows(ResponseStatusException.class, () -> access.requireLessonAccess(buyer, published)).getStatusCode());
        CourseEnrollment enrollment = new CourseEnrollment();
        enrollment.setUser(buyer);
        enrollment.setCourse(published.getModule().getCourse());
        enrollment.setSource(EnrollmentSource.PURCHASE);
        enrollment.setEnrolledAt(LocalDateTime.now(ZoneId.of("Europe/Warsaw")));
        enrollment.setAccessExpiresAt(LocalDateTime.now(ZoneId.of("Europe/Warsaw")).plusDays(30));
        enrollment.setActive(true);
        enrollments.saveAndFlush(enrollment);
        assertDoesNotThrow(() -> access.requireLessonAccess(buyer, published));

        enrollment.setAccessExpiresAt(LocalDateTime.now(ZoneId.of("Europe/Warsaw")).minusMinutes(1));
        enrollments.saveAndFlush(enrollment);
        assertEquals(HttpStatus.PAYMENT_REQUIRED,
                assertThrows(ResponseStatusException.class, () -> access.requireLessonAccess(buyer, published)).getStatusCode());
    }

    private Course course(String name, boolean published) {
        Course course = new Course();
        course.setName(name);
        course.setPublished(published);
        course.setBillingMode(CourseBillingMode.FLEXIBLE);
        course.setPrice(new BigDecimal("1290"));
        return courses.saveAndFlush(course);
    }

    private Lesson lesson(Course course, BlockType type, boolean blockPublished) {
        CourseModule module = new CourseModule();
        module.setCourse(course);
        module.setName("Etap");
        module = modules.saveAndFlush(module);
        Lesson lesson = new Lesson();
        lesson.setTitle("Zaimportowana lekcja");
        lesson.setModule(module);
        lesson.setPublished(false);
        lesson = lessons.saveAndFlush(lesson);
        if (type != null) {
            LessonBlock block = new LessonBlock();
            block.setLesson(lesson);
            block.setType(type);
            block.setTitle("Materiał");
            block.setContent("Treść lekcji");
            block.setPublished(blockPublished);
            blocks.saveAndFlush(block);
        }
        return lesson;
    }
}

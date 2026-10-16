package com.twojlogin.lms.service;

import com.twojlogin.lms.entity.*;
import com.twojlogin.lms.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@Import(PublicCourseOfferService.class)
class PublicCourseOfferServiceTest {
    @Autowired PublicCourseOfferService service;
    @Autowired CourseRepository courses;
    @Autowired CourseModuleRepository modules;
    @Autowired LessonRepository lessons;
    @Autowired LessonBlockRepository blocks;

    @Test
    void distinguishesPlannedLessonsFromPublishedMaterialsWithoutExposingPaidContent() throws Exception {
        Course privateCourse = course("Java Backend Developer", false);
        Course course = course("Java Backend Developer", true);
        course.setBillingMode(CourseBillingMode.SUBSCRIPTION);
        course.setMonthlyPrice(new BigDecimal("89.00"));
        courses.saveAndFlush(course);
        CourseModule module = new CourseModule();
        module.setCourse(course);
        module.setName("Pierwsze kroki");
        module = modules.saveAndFlush(module);
        lesson(module, true, "Materiał");
        Lesson taskLesson = lesson(module, true, "");
        block(taskLesson, true, BlockType.TASK);
        lesson(module, false, "Nieopublikowany materiał");
        block(lesson(module, true, ""), false, BlockType.TEXT);
        block(lesson(module, true, ""), true, BlockType.DIVIDER);
        lesson(module, true, "");
        lesson(module, true, "   ");

        var offer = service.javaBackendOffer();
        assertNotEquals(privateCourse.getId(), offer.id());
        assertEquals(course.getId(), offer.id());
        assertEquals(new BigDecimal("89.00"), offer.monthlyPrice());
        assertEquals("SUBSCRIPTION", offer.billingMode());
        assertEquals(7, offer.plannedLessonCount());
        assertEquals(2, offer.availableLessonCount());
        assertEquals("Pierwsze kroki", offer.outline().get(0).title());
        String json = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(offer);
        assertFalse(json.contains("TAJNE_ROZWIĄZANIE"));
        assertFalse(json.contains("expectedAnswer"));
        assertFalse(json.contains("hiddenTests"));
        assertFalse(json.contains("paymentUrl"));
    }

    @Test
    void anUnpublishedCourseOrADifferentJavaCourseDoesNotGetAPublicOffer() {
        course("Java Backend Developer", false);
        course("JavaScript Backend Developer", true);
        var error = assertThrows(ResponseStatusException.class, service::javaBackendOffer);
        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
    }

    private Course course(String name, boolean published) {
        Course course = new Course();
        course.setName(name);
        course.setPublished(published);
        return courses.saveAndFlush(course);
    }

    private Lesson lesson(CourseModule module, boolean published, String content) {
        Lesson lesson = new Lesson();
        lesson.setModule(module);
        lesson.setTitle("Lekcja");
        lesson.setPublished(published);
        lesson.setContent(content);
        return lessons.saveAndFlush(lesson);
    }

    private void block(Lesson lesson, boolean published, BlockType type) {
        LessonBlock block = new LessonBlock();
        block.setLesson(lesson);
        block.setTitle("Blok");
        block.setType(type);
        block.setPublished(published);
        block.setInstruction("Polecenie");
        block.setExpectedAnswer("TAJNE_ROZWIĄZANIE");
        blocks.saveAndFlush(block);
    }
}

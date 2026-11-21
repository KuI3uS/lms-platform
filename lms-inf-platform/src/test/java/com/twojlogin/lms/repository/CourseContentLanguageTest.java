package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.Course;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest
class CourseContentLanguageTest {
    @Autowired JdbcTemplate jdbc;
    @Autowired CourseRepository courses;
    @Autowired EntityManager entityManager;

    @Test
    void databaseDefaultKeepsLegacyUnlabelledRowsPolish() {
        jdbc.update("insert into course (name, published) values (?, ?)", "Existing Polish material", true);
        assertEquals("pl", jdbc.queryForObject(
                "select content_language from course where name = ?", String.class, "Existing Polish material"));
    }

    @Test
    void authoredLanguagePersistsSeparatelyFromTaughtLanguage() {
        Course course = new Course();
        course.setName("English explained in Spanish");
        course.setContentLanguage("es");
        course.setCourseLanguage("ENGLISH");
        course = courses.saveAndFlush(course);
        entityManager.clear();
        Course reloaded = courses.findById(course.getId()).orElseThrow();
        assertEquals("es", reloaded.getContentLanguage());
        assertEquals("ENGLISH", reloaded.getCourseLanguage());
    }
}

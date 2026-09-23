package com.twojlogin.lms;

import com.twojlogin.lms.controller.LessonBlockController;
import com.twojlogin.lms.dto.LessonBlockRequest;
import com.twojlogin.lms.entity.Course;
import com.twojlogin.lms.entity.CourseModule;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.repository.CourseModuleRepository;
import com.twojlogin.lms.repository.CourseRepository;
import com.twojlogin.lms.repository.LessonBlockRepository;
import com.twojlogin.lms.repository.LessonRepository;
import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.tomcat.autoconfigure.TomcatServerProperties;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import javax.sql.DataSource;
import java.net.HttpURLConnection;
import java.net.URI;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

// Uses the test-only in-memory database, never the production database.
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "registration.disposable-email.enabled=false")
@ActiveProfiles("render")
@DirtiesContext
class RenderMemoryProfileTest {
    @LocalServerPort int port;
    @Autowired DataSource dataSource;
    @Autowired TomcatServerProperties tomcat;
    @Autowired ObjectMapper mapper;
    @Autowired CourseRepository courses;
    @Autowired CourseModuleRepository modules;
    @Autowired LessonRepository lessons;
    @Autowired LessonBlockRepository blocks;
    @Autowired LessonBlockController controller;

    @Test
    void startsServerWithBoundedPoolsAndRespondsToHealthCheck() throws Exception {
        HikariDataSource pool = dataSource.unwrap(HikariDataSource.class);
        assertEquals(4, pool.getMaximumPoolSize());
        assertEquals(1, pool.getMinimumIdle());
        assertEquals(16, tomcat.getThreads().getMax());
        assertEquals(2, tomcat.getThreads().getMinSpare());
        assertEquals(128, tomcat.getMaxConnections());
        assertEquals(16, tomcat.getProcessorCache());

        var connection = (HttpURLConnection) URI.create(
                "http://localhost:" + port + "/api/health").toURL().openConnection();
        connection.setConnectTimeout(10_000);
        connection.setReadTimeout(10_000);
        try {
            assertEquals(200, connection.getResponseCode());
            try (var response = connection.getInputStream()) {
                var body = mapper.readTree(response);
                assertEquals("ok", body.path("status").asText());
                assertEquals("2026.09.23-language-import-memory", body.path("version").asText());
            }
        } finally {
            connection.disconnect();
        }
    }

    @Test
    @Transactional
    @WithMockUser(roles = "ADMIN")
    void importsSeventeenLanguageBlocksWithTheRenderProfile() throws Exception {
        Course course = new Course();
        course.setName("Angielski — test pamięci");
        course.setCategory("LANGUAGE");
        courses.saveAndFlush(course);
        CourseModule module = new CourseModule();
        module.setName("A1");
        module.setCourse(course);
        modules.saveAndFlush(module);
        Lesson lesson = new Lesson();
        lesson.setTitle("Hello!");
        lesson.setOrderIndex(1);
        lesson.setModule(module);
        lessons.saveAndFlush(lesson);

        try (var resource = getClass().getResourceAsStream("/hello-language-import.json")) {
            assertNotNull(resource);
            List<LessonBlockRequest> requests = mapper.readValue(
                    resource, new TypeReference<List<LessonBlockRequest>>() {});
            assertEquals(17, controller.createBulk(lesson.getId(), requests).size());
            assertEquals(17, blocks.countByLessonId(lesson.getId()));
        }
    }
}

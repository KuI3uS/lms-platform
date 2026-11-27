package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.EncodedLessonImportRequest;
import com.twojlogin.lms.entity.*;
import com.twojlogin.lms.repository.*;
import jakarta.servlet.http.Cookie;
import com.twojlogin.lms.security.AuthCookieService;
import com.twojlogin.lms.util.LessonImportPayload;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "registration.disposable-email.enabled=false")
@Transactional
class EncodedStageLessonImportTest {
    @Autowired WebApplicationContext context;
    @Autowired CourseRepository courses;
    @Autowired CourseModuleRepository modules;
    @Autowired LessonRepository lessons;
    @Autowired LessonBlockRepository blocks;
    private final JsonMapper json = JsonMapper.builder().build();
    private MockMvc mvc;
    private Lesson lesson;
    private String path;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        var course = new Course();
        course.setName("Import test");
        courses.save(course);
        var module = new CourseModule();
        module.setCourse(course);
        module.setName("Sortowanie po wielu polach");
        modules.save(module);
        lesson = new Lesson();
        lesson.setModule(module);
        lesson.setTitle("Whitelist");
        lesson.setPublished(false);
        lessons.save(lesson);
        path = "/api/lesson-blocks/module/" + module.getId() + "/import-encoded";
    }

    private String document(String code) {
        return "{\"publishLessons\":true,\"lessons\":[{\"lessonId\":" + lesson.getId()
                + ",\"title\":\"Whitelist\",\"blocks\":[{\"type\":\"TEXT\",\"title\":\"Próba\",\"points\":0,\"published\":true,\"content\":"
                + json.writeValueAsString(code) + "}]}]}";
    }

    private String envelope(String document) {
        return json.writeValueAsString(new EncodedLessonImportRequest("base64-utf8",
                Base64.getEncoder().encodeToString(document.getBytes(StandardCharsets.UTF_8))));
    }

    @Test
    void adminImportsExactEducationalCodeAndRetryDoesNotDuplicateBlocks() throws Exception {
        String code = "Zażółć gęślą jaźń 🧪\nassertThrows(() -> sort(\"desc;drop table\"));\n<script>example</script>";
        String body = envelope(document(code));
        mvc.perform(post(path).with(user("author").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.blocksCreated").value(1))
                .andExpect(jsonPath("$.lessonsPublished").value(1));
        assertEquals(code, blocks.findByLessonIdOrderByOrderIndexAsc(lesson.getId()).get(0).getContent());
        mvc.perform(post(path).with(user("author").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.blocksCreated").value(0))
                .andExpect(jsonPath("$.lessonsSkipped").value(1));
        assertEquals(1, blocks.count());
        assertEquals(1, lessons.count());
    }

    @Test
    void anonymousAndStudentCannotImport() throws Exception {
        String body = envelope(document("Materiał"));
        mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());
        mvc.perform(post(path).with(user("learner").roles("STUDENT"))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());
        assertEquals(0, blocks.count());
    }

    @Test
    void sessionCookieStillRequiresCsrf() throws Exception {
        mvc.perform(post(path).with(user("author").roles("ADMIN"))
                        .cookie(new Cookie(AuthCookieService.SESSION_COOKIE, "invalid-session"))
                        .contentType(MediaType.APPLICATION_JSON).content(envelope(document("Materiał"))))
                .andExpect(status().isForbidden());
        assertEquals(0, blocks.count());
    }

    @Test
    void decodedTitleMismatchStillPreventsWrites() throws Exception {
        mvc.perform(post(path).with(user("author").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(envelope(document("Materiał").replace("Whitelist", "Inna lekcja"))))
                .andExpect(status().isConflict());
        assertEquals(0, blocks.count());
        assertFalse(lesson.isPublished());
    }

    @Test
    void malformedEnvelopeAndJsonAreRejectedBeforeWrites() throws Exception {
        for (String body : new String[]{"{}", "{\"encoding\":\"other\",\"payload\":\"abc\"}",
                "{\"encoding\":\"base64-utf8\",\"payload\":\"not base64!\"}", envelope("not json"), envelope("null")}) {
            mvc.perform(post(path).with(user("author").roles("ADMIN"))
                            .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest());
        }
        assertEquals(0, blocks.count());
    }

    @Test
    void invalidUtf8AndOversizedPayloadAreRejected() {
        String invalidUtf8 = Base64.getEncoder().encodeToString(new byte[]{(byte) 0xc3, 0x28});
        assertEquals(400, assertThrows(ResponseStatusException.class, () -> LessonImportPayload.decode(
                new EncodedLessonImportRequest("base64-utf8", invalidUtf8))).getStatusCode().value());
        assertEquals(413, assertThrows(ResponseStatusException.class, () -> LessonImportPayload.decode(
                new EncodedLessonImportRequest("base64-utf8", "A".repeat(4 * 1024 * 1024 + 4))))
                .getStatusCode().value());
    }
}

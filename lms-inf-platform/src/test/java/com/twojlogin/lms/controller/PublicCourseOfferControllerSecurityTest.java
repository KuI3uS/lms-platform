package com.twojlogin.lms.controller;

import com.twojlogin.lms.entity.Course;
import com.twojlogin.lms.repository.CourseRepository;
import com.twojlogin.lms.repository.UserRepository;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.entity.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "registration.disposable-email.enabled=false")
@Transactional
class PublicCourseOfferControllerSecurityTest {
    @Autowired WebApplicationContext context;
    @Autowired CourseRepository courses;
    @Autowired UserRepository users;
    MockMvc mvc;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    @Test
    void anonymousVisitorsCanReadOnlyThePublishedOffer() throws Exception {
        Course course = new Course();
        course.setName("Java Backend Developer");
        course.setPublished(true);
        courses.saveAndFlush(course);
        mvc.perform(get("/api/public/courses/java-backend-developer"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Java Backend Developer"))
                .andExpect(jsonPath("$.availableLessonCount").value(0))
                .andExpect(jsonPath("$.paymentUrl").doesNotExist());
    }

    @Test
    void unpublishedCoursesStayHidden() throws Exception {
        Course course = new Course();
        course.setName("Java Backend Developer");
        course.setPublished(false);
        courses.saveAndFlush(course);
        mvc.perform(get("/api/public/courses/java-backend-developer")).andExpect(status().isNotFound());
    }

    @Test
    void languageIsPartOfThePublicOfferRequestNotTheTaughtLanguage() throws Exception {
        Course course = new Course();
        course.setName("Java Backend Developer");
        course.setPublished(true);
        courses.saveAndFlush(course);
        mvc.perform(get("/api/public/courses/java-backend-developer").param("lang", "pl"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.contentLanguage").value("pl"));
        mvc.perform(get("/api/public/courses/java-backend-developer").param("lang", "en"))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/public/courses/java-backend-developer").param("lang", "es"))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/public/courses/java-backend-developer").param("lang", "fr"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void studentCatalogRequestsAreLanguageScopedAndCannotRequestAllLanguages() throws Exception {
        User student = account(Role.STUDENT);
        Course polish = localizedCourse("pl", true);
        localizedCourse("en", true);
        localizedCourse("es", false);
        mvc.perform(get("/api/courses").param("lang", "en").with(user(student.getEmail()).roles("STUDENT")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].contentLanguage").value("en"));
        mvc.perform(get("/api/courses/my").param("lang", "en").with(user(student.getEmail()).roles("STUDENT")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].contentLanguage").value("en"));
        mvc.perform(get("/api/courses").param("lang", "es").with(user(student.getEmail()).roles("STUDENT")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/courses").param("allLanguages", "true").with(user(student.getEmail()).roles("STUDENT")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/courses").param("lang", "de").with(user(student.getEmail()).roles("STUDENT")))
                .andExpect(status().isBadRequest());
        // Changing catalogue language is not a revocation of access to original purchases/free courses.
        mvc.perform(get("/api/courses/" + polish.getId()).with(user(student.getEmail()).roles("STUDENT")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.canAccess").value(true));
    }

    @Test
    void administratorMayManageAllLanguageVersionsAndDrafts() throws Exception {
        User admin = account(Role.ADMIN);
        localizedCourse("pl", true);
        localizedCourse("en", true);
        localizedCourse("es", false);
        mvc.perform(get("/api/courses").param("allLanguages", "true").with(user(admin.getEmail()).roles("ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(3));
        mvc.perform(get("/api/courses").param("lang", "es").with(user(admin.getEmail()).roles("ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].published").value(false));
    }

    private User account(Role role) {
        User account = new User();
        account.setEmail("locale-" + role + "@example.invalid");
        account.setPassword("unused-in-mocked-authentication");
        account.setRole(role);
        account.setEnabled(true);
        return users.saveAndFlush(account);
    }

    private Course localizedCourse(String language, boolean published) {
        Course course = new Course();
        course.setName("Course " + language);
        course.setContentLanguage(language);
        course.setPublished(published);
        return courses.saveAndFlush(course);
    }

    @Test
    void existingCourseContentAndWriteRoutesStillRequireAuthentication() throws Exception {
        mvc.perform(get("/api/courses/1")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/lesson-blocks/lesson/1")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/public/courses/java-backend-developer")).andExpect(status().isUnauthorized());
    }
}

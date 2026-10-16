package com.twojlogin.lms.controller;

import com.twojlogin.lms.entity.Course;
import com.twojlogin.lms.repository.CourseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "registration.disposable-email.enabled=false")
@Transactional
class PublicCourseOfferControllerSecurityTest {
    @Autowired WebApplicationContext context;
    @Autowired CourseRepository courses;
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
    void existingCourseContentAndWriteRoutesStillRequireAuthentication() throws Exception {
        mvc.perform(get("/api/courses/1")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/lesson-blocks/lesson/1")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/public/courses/java-backend-developer")).andExpect(status().isUnauthorized());
    }
}

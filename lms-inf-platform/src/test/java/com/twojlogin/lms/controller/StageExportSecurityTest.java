package com.twojlogin.lms.controller;

import com.twojlogin.lms.entity.*;
import com.twojlogin.lms.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "registration.disposable-email.enabled=false")
@Transactional
class StageExportSecurityTest {
    @Autowired WebApplicationContext context;
    @Autowired CourseRepository courses;
    @Autowired CourseModuleRepository modules;
    @Autowired LessonRepository lessons;
    @Autowired LessonBlockRepository blocks;
    MockMvc mvc;
    String path;

    @BeforeEach
    void setup() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
        Course course = new Course();
        course.setName("Secret authoring course");
        course = courses.save(course);
        CourseModule module = new CourseModule();
        module.setCourse(course);
        module.setName("Private stage");
        module = modules.save(module);
        Lesson lesson = new Lesson();
        lesson.setModule(module);
        lesson.setTitle("Draft");
        lesson = lessons.save(lesson);
        LessonBlock block = new LessonBlock();
        block.setLesson(lesson);
        block.setType(BlockType.TASK);
        block.setExpectedAnswer("AUTHOR-SOLUTION");
        block.setHiddenTests("PRIVATE-TEST");
        blocks.saveAndFlush(block);
        path = "/api/admin/modules/" + module.getId() + "/export";
    }

    @Test
    void anonymousVisitorCannotDownloadEvenUsingADirectLink() throws Exception {
        mvc.perform(get(path)).andExpect(status().isUnauthorized());
    }

    @Test
    void studentCannotDownloadEvenIfTheyKnowTheStageId() throws Exception {
        mvc.perform(get(path).with(user("student@example.invalid").roles("STUDENT")))
                .andExpect(status().isForbidden())
                .andExpect(content().string(org.hamcrest.Matchers.not(containsString("AUTHOR-SOLUTION"))));
    }

    @Test
    void administratorReceivesSolutionsButNoStudentDataAndResponseIsNotCacheable() throws Exception {
        mvc.perform(get(path).with(user("admin@example.invalid").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", containsString("no-store")))
                .andExpect(header().string("Cache-Control", containsString("private")))
                .andExpect(jsonPath("$.lessons[0].blocks[0].expectedAnswer").value("AUTHOR-SOLUTION"))
                .andExpect(jsonPath("$.lessons[0].blocks[0].hiddenTests").value("PRIVATE-TEST"))
                .andExpect(jsonPath("$.lessons[0].blocks[0].lastAnswer").doesNotExist())
                .andExpect(jsonPath("$.lessons[0].blocks[0].attemptCount").doesNotExist())
                .andExpect(jsonPath("$.lessons[0].blocks[0].correct").doesNotExist())
                .andExpect(jsonPath("$.users").doesNotExist());
    }
}

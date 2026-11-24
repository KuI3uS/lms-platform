package com.twojlogin.lms.service;

import com.twojlogin.lms.entity.*;
import com.twojlogin.lms.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest(showSql = false)
@Import(StageExportService.class)
class StageExportServiceTest {
    @Autowired StageExportService service;
    @Autowired CourseRepository courses;
    @Autowired CourseModuleRepository modules;
    @Autowired LessonRepository lessons;
    @Autowired LessonBlockRepository blocks;

    @Test
    void exportsTheEntireStageInStableOrderWithDraftsSolutionsAndLegacyContentWithoutWriting() {
        Course course = course("pl");
        module(course, "Pierwszy etap");
        CourseModule stage = module(course, "JDK, JVM i JRE");
        stage.setLessonsLocked(true);
        stage.setSectionTitle("CZĘŚĆ I");
        Lesson second = lesson(stage, "Druga lekcja", 20);
        Lesson first = lesson(stage, "Pierwsza lekcja", 10);
        first.setTheory("Starsza teoria");
        first.setExample("System.out.println(1);");
        first.setContent("Starsza treść");
        first.setImageUrl("/image.png");
        first.setFreePreview(true);
        LessonBlock last = block(first, 9, "Późniejszy blok");
        LessonBlock secret = block(first, 1, "Szkic z rozwiązaniem");
        secret.setPublished(false);
        secret.setStarterCode("public class Main {}");
        secret.setExpectedAnswer("wzór odpowiedzi");
        secret.setHiddenTests("<brak> => 1");
        secret.setHint("Pierwsza podpowiedź");
        secret.setDetailedHint("Druga podpowiedź");
        secret.setSolutionExplanation("Wyjaśnienie");
        secret.setLanguage("java");
        secret.setMediaUrl("/audio.mp3");
        secret.setMediaType("test");
        secret.setPoints(75);
        block(lesson(module(course("es"), "Obcy etap"), "Obca lekcja", 1), 0, "Nie eksportuj");
        blocks.flush();
        long lessonCount = lessons.count(), blockCount = blocks.count();

        var result = service.export(stage.getId());

        assertEquals(1, result.version());
        assertEquals(2, result.stageNumber());
        assertEquals("pl", result.contentLanguage());
        assertTrue(result.lessonsLocked());
        assertEquals("CZĘŚĆ I", result.sectionTitle());
        assertEquals(List.of(first.getTitle(), second.getTitle()), result.lessons().stream().map(item -> item.title()).toList());
        var exported = result.lessons().get(0);
        assertFalse(exported.published());
        assertTrue(exported.freePreview());
        assertEquals(first.getTheory(), exported.theory());
        assertEquals(first.getExample(), exported.example());
        assertEquals(first.getContent(), exported.content());
        assertEquals(first.getImageUrl(), exported.imageUrl());
        assertEquals(List.of(secret.getTitle(), last.getTitle()), exported.blocks().stream().map(item -> item.title()).toList());
        var full = exported.blocks().get(0);
        assertEquals(secret.getExpectedAnswer(), full.expectedAnswer());
        assertEquals(secret.getHiddenTests(), full.hiddenTests());
        assertEquals(secret.getStarterCode(), full.starterCode());
        assertEquals(secret.getHint(), full.hint());
        assertEquals(secret.getDetailedHint(), full.detailedHint());
        assertEquals(secret.getSolutionExplanation(), full.solutionExplanation());
        assertEquals(75, full.points());
        assertFalse(full.published());
        assertTrue(result.lessons().get(1).blocks().isEmpty());
        assertEquals(lessonCount, lessons.count());
        assertEquals(blockCount, blocks.count());
        assertFalse(first.isPublished());
        assertFalse(secret.getPublished());
    }

    @Test
    void emptyStagesAndMoreThanFiftyLessonsAreExportedWithoutTruncation() {
        CourseModule stage = module(course("en"), "English stage");
        assertTrue(service.export(stage.getId()).lessons().isEmpty());
        for (int index = 0; index < 51; index++) lesson(stage, "Lesson " + index, index);
        assertEquals(51, service.export(stage.getId()).lessons().size());
        assertEquals("en", service.export(stage.getId()).contentLanguage());
    }

    @Test
    void missingStageReturnsNotFound() {
        assertEquals(404, assertThrows(ResponseStatusException.class,
                () -> service.export(Long.MAX_VALUE)).getStatusCode().value());
    }

    private Course course(String language) {
        Course course = new Course();
        course.setName("Course " + language);
        course.setContentLanguage(language);
        return courses.save(course);
    }
    private CourseModule module(Course course, String name) {
        CourseModule module = new CourseModule();
        module.setCourse(course);
        module.setName(name);
        return modules.save(module);
    }
    private Lesson lesson(CourseModule module, String title, int order) {
        Lesson lesson = new Lesson();
        lesson.setModule(module);
        lesson.setTitle(title);
        lesson.setOrderIndex(order);
        return lessons.save(lesson);
    }
    private LessonBlock block(Lesson lesson, int order, String title) {
        LessonBlock block = new LessonBlock();
        block.setLesson(lesson);
        block.setTitle(title);
        block.setType(BlockType.TEXT);
        block.setContent("Materiał");
        block.setOrderIndex(order);
        return blocks.save(block);
    }
}

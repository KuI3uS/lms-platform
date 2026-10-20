package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.LessonBlockRequest;
import com.twojlogin.lms.dto.StageLessonBlockImportRequest;
import com.twojlogin.lms.entity.*;
import com.twojlogin.lms.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = "registration.disposable-email.enabled=false")
@Transactional
@WithMockUser(username = "stage-admin@example.invalid", roles = "ADMIN")
class StageLessonBlockImportTest {
    @Autowired LessonBlockController controller;
    @Autowired LessonController lessonController;
    @Autowired LessonRepository lessons;
    @Autowired LessonBlockRepository blocks;
    @Autowired CourseRepository courses;
    @Autowired CourseModuleRepository modules;
    @Autowired UserRepository users;

    @Test
    void importsFiftyExistingLessonsWithTenBlocksWithoutCreatingOrReorderingAnyCards() {
        var module = module();
        List<StageLessonBlockImportRequest.LessonBlocks> items = new ArrayList<>();
        List<Long> ids = new ArrayList<>();
        for (int index = 1; index <= 50; index++) {
            Lesson lesson = lesson(module, "SQL " + index, index);
            ids.add(lesson.getId());
            items.add(item(lesson, 10));
        }
        var request = new StageLessonBlockImportRequest(items, true);
        long before = lessons.count();
        var result = controller.importStage(module.getId(), request);
        assertEquals(50, result.lessonsFilled());
        assertEquals(50, result.lessonsPublished());
        assertEquals(500, result.blocksCreated());
        assertEquals(before, lessons.count());
        assertEquals(ids, lessons.findByModuleIdOrderByOrderIndexAsc(module.getId()).stream().map(Lesson::getId).toList());
        assertTrue(lessons.findByModuleIdOrderByOrderIndexAsc(module.getId()).stream().allMatch(Lesson::isPublished));

        var repeated = controller.importStage(module.getId(), request);
        assertEquals(50, repeated.lessonsSkipped());
        assertEquals(0, repeated.blocksCreated());
        assertEquals(0, repeated.lessonsPublished());
        assertEquals(500, blocks.count());
        assertEquals(before, lessons.count());
    }

    @Test
    void unknownLessonInTheSecondItemPreventsAllWrites() {
        var module = module();
        Lesson first = lesson(module, "WHERE", 1);
        long before = lessons.count();
        var missing = new StageLessonBlockImportRequest.LessonBlocks(-1L, "Nowa lekcja", List.of(text("Materiał")));
        var error = assertThrows(ResponseStatusException.class, () -> controller.importStage(module.getId(),
                new StageLessonBlockImportRequest(List.of(item(first, 1), missing), true)));
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        assertEquals(0, blocks.count());
        assertFalse(first.isPublished());
        assertEquals(before, lessons.count());
    }

    @Test
    void rejectsLessonFromAnotherStageWithoutCreatingAnyCards() {
        var target = module();
        var foreign = lesson(module(), "SELECT", 1);
        assertThrows(ResponseStatusException.class, () -> controller.importStage(target.getId(),
                new StageLessonBlockImportRequest(List.of(item(foreign, 1)), true)));
        assertEquals(0, blocks.count());
        assertEquals(1, lessons.count());
    }

    @Test
    void titleMismatchDoesNotUseTheLessonNumberAsAnUnsafeFallback() {
        var module = module();
        var target = lesson(module, "SELECT", 1);
        var mismatched = new StageLessonBlockImportRequest.LessonBlocks(target.getId(), "WHERE", List.of(text("Treść")));
        var error = assertThrows(ResponseStatusException.class, () -> controller.importStage(module.getId(),
                new StageLessonBlockImportRequest(List.of(mismatched), true)));
        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        assertEquals(0, blocks.count());
    }

    @Test
    void rejectsRepeatedTargetsEvenWhenTheirNamesMatch() {
        var module = module();
        var target = lesson(module, "SELECT", 1);
        assertThrows(ResponseStatusException.class, () -> controller.importStage(module.getId(),
                new StageLessonBlockImportRequest(List.of(item(target, 1), item(target, 1)), true)));
        assertEquals(0, blocks.count());
    }

    @Test
    void invalidLaterBlockOrTooManyBlocksCannotPartiallyFillEarlierLessons() {
        var module = module();
        var first = lesson(module, "WHERE", 1);
        var second = lesson(module, "SELECT", 2);
        assertThrows(ResponseStatusException.class, () -> controller.importStage(module.getId(),
                new StageLessonBlockImportRequest(List.of(item(first, 1), item(second, 11)), true)));
        assertEquals(0, blocks.count());
        assertFalse(first.isPublished());
        assertFalse(second.isPublished());
    }

    @Test
    void rejectsMoreThanFiftyLessonsBeforeSavingAnything() {
        var module = module();
        var target = lesson(module, "WHERE", 1);
        var oversized = IntStream.range(0, 51).mapToObj(index -> item(target, 1)).toList();
        assertThrows(ResponseStatusException.class, () -> controller.importStage(module.getId(),
                new StageLessonBlockImportRequest(oversized, true)));
        assertEquals(0, blocks.count());
        assertEquals(1, lessons.count());
    }

    @Test
    void existingBlocksArePreservedButRequestedPublicationIsNotSkipped() {
        var module = module();
        var existing = lesson(module, "AS - alias", 1);
        var original = block(existing, true, BlockType.TEXT);
        var imported = new StageLessonBlockImportRequest.LessonBlocks(existing.getId(), "AS — alias", List.of(text("Nie nadpisuj starej treści")));
        var result = controller.importStage(module.getId(), new StageLessonBlockImportRequest(List.of(imported), true));
        assertEquals(1, result.lessonsSkipped());
        assertEquals(1, result.lessonsPublished());
        assertEquals(0, result.blocksCreated());
        assertEquals("Dotychczasowy materiał", blocks.findById(original.getId()).orElseThrow().getContent());
        assertTrue(existing.isPublished());
        assertEquals(1, blocks.count());
    }

    @Test
    void importingAsDraftPreservesPublicationStatusOfExistingLessons() {
        var module = module();
        var target = lesson(module, "SELECT", 1);
        var result = controller.importStage(module.getId(), new StageLessonBlockImportRequest(List.of(item(target, 1)), false));
        assertEquals(1, result.lessonsFilled());
        assertEquals(0, result.lessonsPublished());
        assertFalse(target.isPublished());
    }

    @Test
    void publishReadyOnlyChangesDraftsWithPublishedMaterialsInTheSelectedStage() {
        var module = module();
        var ready = lesson(module, "WHERE", 1);
        block(ready, true, BlockType.TEXT);
        var empty = lesson(module, "Pusty plan", 2);
        var hidden = lesson(module, "Ukryte bloki", 3);
        block(hidden, false, BlockType.TEXT);
        var divider = lesson(module, "Sam nagłówek", 4);
        block(divider, true, BlockType.DIVIDER);
        var other = lesson(module(), "Inny etap", 1);
        block(other, true, BlockType.TEXT);
        assertEquals(1, controller.publishReadyStageLessons(module.getId()).get("lessonsPublished"));
        assertTrue(ready.isPublished());
        assertFalse(empty.isPublished());
        assertFalse(hidden.isPublished());
        assertFalse(divider.isPublished());
        assertFalse(other.isPublished());
        assertEquals(0, controller.publishReadyStageLessons(module.getId()).get("lessonsPublished"));
    }

    @Test
    void administratorCanDistinguishReadyDraftsFromEmptyCardsWithoutOpeningEachLesson() {
        User admin = new User();
        admin.setEmail("stage-admin@example.invalid");
        admin.setPassword("test-only");
        admin.setRole(Role.ADMIN);
        users.saveAndFlush(admin);
        var module = module();
        var ready = lesson(module, "WHERE", 1);
        block(ready, true, BlockType.TEXT);
        lesson(module, "Pusty plan", 2);
        var list = lessonController.getByModule(module.getId(), SecurityContextHolder.getContext().getAuthentication());
        assertEquals(1, list.get(0).blockCount);
        assertEquals(1, list.get(0).publishedBlockCount);
        assertFalse(list.get(0).published);
        assertEquals(0, list.get(1).blockCount);
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void onlyAnAdministratorCanImportOrPublishStageLessons() {
        var module = module();
        var target = lesson(module, "WHERE", 1);
        assertThrows(AccessDeniedException.class, () -> controller.importStage(module.getId(),
                new StageLessonBlockImportRequest(List.of(item(target, 1)), true)));
        assertThrows(AccessDeniedException.class, () -> controller.publishReadyStageLessons(module.getId()));
        assertThrows(AccessDeniedException.class, () -> lessonController.importPlan(module.getCourse().getId(),
                new com.twojlogin.lms.dto.LessonPlanImportRequest(List.of(
                        new com.twojlogin.lms.dto.LessonPlanImportRequest.StageLessons(2, "Nowy etap", List.of("Lekcja"))))));
        assertFalse(target.isPublished());
        assertEquals(0, blocks.count());
    }

    private CourseModule module() {
        Course course = new Course();
        course.setName("Etap testowy importu SQL");
        course.setPublished(true);
        course = courses.saveAndFlush(course);
        CourseModule module = new CourseModule();
        module.setCourse(course);
        module.setName("SQL");
        return modules.saveAndFlush(module);
    }

    private Lesson lesson(CourseModule module, String title, int order) {
        Lesson lesson = new Lesson();
        lesson.setModule(module);
        lesson.setTitle(title);
        lesson.setOrderIndex(order);
        lesson.setPublished(false);
        return lessons.saveAndFlush(lesson);
    }

    private LessonBlock block(Lesson lesson, boolean published, BlockType type) {
        LessonBlock block = new LessonBlock();
        block.setLesson(lesson);
        block.setType(type);
        block.setTitle("Istniejący blok");
        block.setContent("Dotychczasowy materiał");
        block.setPublished(published);
        return blocks.saveAndFlush(block);
    }

    private StageLessonBlockImportRequest.LessonBlocks item(Lesson lesson, int blockCount) {
        return new StageLessonBlockImportRequest.LessonBlocks(lesson.getId(), lesson.getTitle(),
                IntStream.range(0, blockCount).mapToObj(index -> text("Materiał " + index)).toList());
    }

    private LessonBlockRequest text(String content) {
        return new LessonBlockRequest("Materiał", BlockType.TEXT, content, null, null,
                null, null, null, null, null, null, null, null, null, true, 0, null);
    }
}

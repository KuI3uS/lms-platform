package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.LessonPlanImportRequest;
import com.twojlogin.lms.entity.Course;
import com.twojlogin.lms.entity.CourseModule;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.repository.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
@Import(LessonPlanImportService.class)
class LessonPlanCreationTest {
    @Autowired LessonPlanImportService service;
    @Autowired CourseRepository courses;
    @Autowired CourseModuleRepository modules;
    @Autowired LessonRepository lessons;
    @Autowired LessonBlockRepository blocks;

    @Test
    void createsEighteenStagesAndNinetyDraftLessonSkeletonsInAnEmptyCourse() {
        Course course = course();
        var stages = IntStream.rangeClosed(1, 18).mapToObj(number ->
                new LessonPlanImportRequest.StageLessons(number, "Sieci komputerowe " + number,
                        List.of("Podstawy", "Urządzenia", "Konfiguracja", "Diagnostyka", "Projekt"))).toList();
        var request = new LessonPlanImportRequest(stages);
        var result = service.importPlan(course.getId(), request);
        assertEquals(18, result.stagesCreated());
        assertEquals(90, result.lessonsCreated());
        assertEquals(18, modules.countByCourseId(course.getId()));
        assertEquals(90, lessons.countByModuleCourseId(course.getId()));
        assertEquals(0, blocks.count());
        assertTrue(lessons.findRoadmapLessonsByCourseId(course.getId()).stream().noneMatch(Lesson::isPublished));
        var ids = modules.findByCourseIdOrderByIdAsc(course.getId()).stream().map(CourseModule::getId).toList();
        var repeated = service.importPlan(course.getId(), request);
        assertEquals(0, repeated.stagesCreated());
        assertEquals(0, repeated.lessonsCreated());
        assertEquals(90, repeated.duplicatesSkipped());
        assertEquals(ids, modules.findByCourseIdOrderByIdAsc(course.getId()).stream().map(CourseModule::getId).toList());
    }

    @Test
    void resolvesAnExistingStageByNameWithoutOverwritingAnotherStageAtThatNumber() {
        Course course = course();
        service.importPlan(course.getId(), request(1, "Pierwotny etap", "Stara lekcja"));
        service.importPlan(course.getId(), request(2, "Sieci - podstawy", "Podstawy sieci"));
        var result = service.importPlan(course.getId(), request(1, "Sieci — podstawy", "Nowa lekcja"));
        assertEquals(0, result.stagesCreated());
        var existing = modules.findByCourseIdOrderByIdAsc(course.getId());
        assertEquals(2, existing.size());
        assertEquals(List.of("Stara lekcja"), lessons.findByModuleIdOrderByOrderIndexAsc(existing.get(0).getId()).stream().map(Lesson::getTitle).toList());
        assertEquals(2, lessons.countByModuleId(existing.get(1).getId()));
        var appended = service.importPlan(course.getId(), request(1, "Zupełnie nowy etap", "Temat"));
        assertEquals(1, appended.stagesCreated());
        assertEquals(3, modules.countByCourseId(course.getId()));
    }

    @Test
    void splittingALargeStageAcrossBatchesOrRetryingDoesNotDuplicateStagesOrLessons() {
        Course course = course();
        var first = new LessonPlanImportRequest(List.of(new LessonPlanImportRequest.StageLessons(16, "Duży etap",
                IntStream.rangeClosed(1, 500).mapToObj(number -> "Lekcja " + number).toList())));
        var second = new LessonPlanImportRequest(List.of(new LessonPlanImportRequest.StageLessons(16, "Duży etap",
                IntStream.rangeClosed(501, 700).mapToObj(number -> "Lekcja " + number).toList())));
        assertEquals(1, service.importPlan(course.getId(), first).stagesCreated());
        assertEquals(0, service.importPlan(course.getId(), second).stagesCreated());
        assertEquals(1, modules.countByCourseId(course.getId()));
        assertEquals(700, lessons.countByModuleCourseId(course.getId()));
        assertEquals(500, service.importPlan(course.getId(), first).duplicatesSkipped());
        assertEquals(700, lessons.countByModuleCourseId(course.getId()));
    }

    @Test
    void invalidLaterStageCannotLeavePartiallyCreatedStages() {
        Course course = course();
        var request = new LessonPlanImportRequest(List.of(
                new LessonPlanImportRequest.StageLessons(1, "Dobry etap", List.of("Temat")),
                new LessonPlanImportRequest.StageLessons(2, "Nieprawidłowy etap", List.of("x".repeat(256)))));
        assertThrows(ResponseStatusException.class, () -> service.importPlan(course.getId(), request));
        assertEquals(0, modules.countByCourseId(course.getId()));
        assertEquals(0, lessons.countByModuleCourseId(course.getId()));
    }

    @Test
    void legacyImportWithoutStageNamesStillFillsAnExistingStageButCannotInventUnnamedOnes() {
        Course course = course();
        service.importPlan(course.getId(), request(1, "Sieci", "Podstawy"));
        var legacy = new LessonPlanImportRequest(List.of(new LessonPlanImportRequest.StageLessons(1, List.of("Nowa lekcja"))));
        assertEquals(1, service.importPlan(course.getId(), legacy).lessonsCreated());
        assertEquals(1, modules.countByCourseId(course.getId()));
    }

    private Course course() {
        Course course = new Course();
        course.setName("Sieci komputerowe");
        return courses.saveAndFlush(course);
    }

    private LessonPlanImportRequest request(int number, String name, String title) {
        return new LessonPlanImportRequest(List.of(new LessonPlanImportRequest.StageLessons(number, name, List.of(title))));
    }
}

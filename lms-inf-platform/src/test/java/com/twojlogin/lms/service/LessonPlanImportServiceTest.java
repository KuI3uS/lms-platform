package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.LessonPlanImportRequest;
import com.twojlogin.lms.dto.LessonPlanImportResult;
import com.twojlogin.lms.entity.CourseModule;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.repository.CourseModuleRepository;
import com.twojlogin.lms.repository.CourseRepository;
import com.twojlogin.lms.repository.LessonRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LessonPlanImportServiceTest {

    private final CourseRepository courseRepository = mock(CourseRepository.class);
    private final CourseModuleRepository moduleRepository = mock(CourseModuleRepository.class);
    private final LessonRepository lessonRepository = mock(LessonRepository.class);
    private final LessonPlanImportService service = new LessonPlanImportService(
            courseRepository,
            moduleRepository,
            lessonRepository
    );

    @Test
    void createsUnpublishedLessonsInTheStageAndSkipsExistingTitles() {
        CourseModule first = module(10L, "Etap 1");
        CourseModule second = module(20L, "Etap 2");
        Lesson existing = lesson(second, "Pierwsza lekcja", 1);

        when(courseRepository.existsById(7L)).thenReturn(true);
        when(moduleRepository.findByCourseIdOrderByIdAsc(7L))
                .thenReturn(List.of(first, second));
        when(lessonRepository.findRoadmapLessonsByCourseId(7L))
                .thenReturn(List.of(existing));

        LessonPlanImportResult result = service.importPlan(
                7L,
                new LessonPlanImportRequest(List.of(
                        new LessonPlanImportRequest.StageLessons(
                                2,
                                List.of(
                                        "pierwsza   lekcja",
                                        "Druga lekcja",
                                        "Trzecia lekcja"
                                )
                        )
                ))
        );

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Lesson>> lessonsCaptor = ArgumentCaptor.forClass(List.class);
        verify(lessonRepository).saveAll(lessonsCaptor.capture());
        List<Lesson> saved = lessonsCaptor.getValue();

        assertEquals(1, result.stagesUpdated());
        assertEquals(2, result.lessonsCreated());
        assertEquals(1, result.duplicatesSkipped());
        assertEquals(List.of("Druga lekcja", "Trzecia lekcja"), saved.stream()
                .map(Lesson::getTitle)
                .toList());
        assertEquals(List.of(2, 3), saved.stream().map(Lesson::getOrderIndex).toList());
        assertEquals(List.of(20L, 20L), saved.stream()
                .map(lesson -> lesson.getModule().getId())
                .toList());
        assertFalse(saved.get(0).isPublished());
        assertFalse(saved.get(0).isFreePreview());
        assertEquals("", saved.get(0).getTheory());
        assertEquals("", saved.get(0).getExample());
        assertEquals("", saved.get(0).getContent());
        assertEquals("", saved.get(0).getImageUrl());
    }

    @Test
    void rejectsAStageNumberThatDoesNotExistWithoutWritingAnything() {
        when(courseRepository.existsById(7L)).thenReturn(true);
        when(moduleRepository.findByCourseIdOrderByIdAsc(7L))
                .thenReturn(List.of(module(10L, "Etap 1")));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> service.importPlan(
                        7L,
                        new LessonPlanImportRequest(List.of(
                                new LessonPlanImportRequest.StageLessons(
                                        16,
                                        List.of("Pierwsza lekcja")
                                )
                        ))
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        assertEquals(
                "Etap 16 nie istnieje w tym kursie. Kurs ma 1 etapów",
                error.getReason()
        );
        verify(lessonRepository, never()).saveAll(org.mockito.ArgumentMatchers.anyList());
    }

    private CourseModule module(Long id, String name) {
        CourseModule module = new CourseModule();
        module.setId(id);
        module.setName(name);
        return module;
    }

    private Lesson lesson(CourseModule module, String title, int orderIndex) {
        Lesson lesson = new Lesson();
        lesson.setModule(module);
        lesson.setTitle(title);
        lesson.setOrderIndex(orderIndex);
        return lesson;
    }
}

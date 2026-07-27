package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.CurriculumImportReport;
import com.twojlogin.lms.entity.BlockType;
import com.twojlogin.lms.entity.Course;
import com.twojlogin.lms.entity.CourseModule;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.repository.CourseModuleRepository;
import com.twojlogin.lms.repository.CourseRepository;
import com.twojlogin.lms.repository.LessonBlockRepository;
import com.twojlogin.lms.repository.LessonRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CurriculumImportServiceTest {

    @Mock
    private CourseRepository courseRepository;
    @Mock
    private CourseModuleRepository moduleRepository;
    @Mock
    private LessonRepository lessonRepository;
    @Mock
    private LessonBlockRepository blockRepository;

    private CurriculumImportService service;
    private Course course;
    private CourseModule emptyModule;

    @BeforeEach
    void setUp() {
        service = new CurriculumImportService(
                courseRepository,
                moduleRepository,
                lessonRepository,
                blockRepository
        );
        course = new Course();
        course.setId(7L);
        course.setTitle("Java od podstaw");

        emptyModule = new CourseModule();
        emptyModule.setId(11L);
        emptyModule.setName("1. Wprowadzenie do programowania");
        emptyModule.setCourse(course);
    }

    @Test
    void previewIsReadOnlyAndReportsPlannedContent() {
        when(courseRepository.findById(7L)).thenReturn(Optional.of(course));
        when(moduleRepository.findByCourseIdOrderByIdAsc(7L))
                .thenReturn(List.of(emptyModule));
        when(lessonRepository.countByModuleId(11L)).thenReturn(0L);

        CurriculumImportReport report = service.preview(7L);

        assertEquals("PREVIEW", report.mode());
        assertEquals(1, report.readyModules());
        assertEquals(2, report.lessons());
        assertEquals(10, report.blocks());
        verify(moduleRepository, never()).save(any());
        verify(lessonRepository, never()).save(any());
        verifyNoInteractions(blockRepository);
    }

    @Test
    void importsTwoPublishedLessonsAndTenBlocksIntoEmptyModule() {
        when(courseRepository.findById(7L)).thenReturn(Optional.of(course));
        when(moduleRepository.findByCourseIdOrderByIdAsc(7L))
                .thenReturn(List.of(emptyModule));
        when(lessonRepository.countByModuleId(11L)).thenReturn(0L);
        when(lessonRepository.save(any(Lesson.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CurriculumImportReport report = service.importIntoEmptyModules(7L);

        assertEquals("IMPORT", report.mode());
        assertEquals(2, report.lessons());
        assertEquals(10, report.blocks());
        assertTrue(emptyModule.isLessonsLocked());
        assertEquals("Od podstaw do Junior Java Developera", course.getLevel());
        assertTrue(course.getDescription().contains("Java 25 LTS"));
        verify(courseRepository).save(course);

        ArgumentCaptor<Lesson> lessonCaptor = ArgumentCaptor.forClass(Lesson.class);
        verify(lessonRepository, org.mockito.Mockito.times(2)).save(lessonCaptor.capture());
        assertTrue(lessonCaptor.getAllValues().stream().allMatch(Lesson::isPublished));
        assertTrue(lessonCaptor.getAllValues().get(0).isFreePreview());
        assertFalse(lessonCaptor.getAllValues().get(1).isFreePreview());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<LessonBlock>> blocksCaptor =
                ArgumentCaptor.forClass(List.class);
        verify(blockRepository, org.mockito.Mockito.times(2))
                .saveAll(blocksCaptor.capture());
        List<LessonBlock> blocks = blocksCaptor.getAllValues().stream()
                .flatMap(List::stream)
                .toList();
        assertEquals(10, blocks.size());
        assertEquals(1, blocks.stream().filter(block -> block.getType() == BlockType.TASK).count());
        assertEquals(1, blocks.stream().filter(block -> block.getType() == BlockType.QUIZ).count());
    }

    @Test
    void skipsModuleThatAlreadyHasLessons() {
        when(courseRepository.findById(7L)).thenReturn(Optional.of(course));
        when(moduleRepository.findByCourseIdOrderByIdAsc(7L))
                .thenReturn(List.of(emptyModule));
        when(lessonRepository.countByModuleId(11L)).thenReturn(3L);

        CurriculumImportReport report = service.importIntoEmptyModules(7L);

        assertEquals(0, report.readyModules());
        assertEquals(1, report.skippedNonEmptyModules());
        assertEquals(0, report.lessons());
        verify(lessonRepository, never()).save(any());
        verifyNoInteractions(blockRepository);
    }
}

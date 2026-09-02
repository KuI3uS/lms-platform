package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.CourseRoadmapDto;
import com.twojlogin.lms.entity.Course;
import com.twojlogin.lms.entity.CourseModule;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.CourseModuleRepository;
import com.twojlogin.lms.repository.CourseRepository;
import com.twojlogin.lms.repository.LessonProgressRepository;
import com.twojlogin.lms.repository.LessonRepository;
import com.twojlogin.lms.repository.LessonBlockRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CourseRoadmapServiceTest {

    @Test
    void loadsCompactRoadmapWithOneBatchedLessonQuery() {
        CourseRepository courseRepository = mock(CourseRepository.class);
        CourseModuleRepository moduleRepository =
                mock(CourseModuleRepository.class);
        LessonRepository lessonRepository = mock(LessonRepository.class);
        LessonBlockRepository blockRepository = mock(LessonBlockRepository.class);
        LessonProgressRepository progressRepository =
                mock(LessonProgressRepository.class);
        CourseAccessService accessService = mock(CourseAccessService.class);
        Authentication authentication = mock(Authentication.class);
        CourseRoadmapService service = new CourseRoadmapService(
                courseRepository,
                moduleRepository,
                lessonRepository,
                blockRepository,
                progressRepository,
                accessService
        );

        User user = new User();
        user.setId(7L);

        Course course = new Course();
        course.setId(10L);
        course.setName("Java");
        course.setTitle("Java od podstaw");
        course.setPublished(true);

        CourseModule module = new CourseModule();
        module.setId(20L);
        module.setName("Podstawy");
        module.setLessonsLocked(true);
        module.setCourse(course);

        Lesson first = lesson(31L, "Start", 1, module);
        Lesson second = lesson(32L, "Zmienne", 2, module);
        Lesson third = lesson(33L, "Pętle", 3, module);

        when(accessService.currentUser(authentication)).thenReturn(user);
        when(accessService.isAdmin(user)).thenReturn(false);
        when(courseRepository.findById(course.getId()))
                .thenReturn(Optional.of(course));
        when(moduleRepository.findByCourseIdOrderByIdAsc(course.getId()))
                .thenReturn(List.of(module));
        when(lessonRepository.findRoadmapLessonsByCourseId(course.getId()))
                .thenReturn(List.of(first, second, third));
        when(blockRepository.countPublishedByLessonIds(
                List.of(first.getId(), second.getId(), third.getId())
        )).thenReturn(List.of(
                new Object[]{first.getId(), 2L},
                new Object[]{second.getId(), 3L}
        ));
        when(progressRepository.findCompletedLessonIdsByUserIdAndCourseId(
                user.getId(),
                course.getId()
        )).thenReturn(List.of(first.getId()));

        CourseRoadmapDto roadmap =
                service.getRoadmap(course.getId(), authentication);

        assertEquals("Java od podstaw", roadmap.title());
        assertEquals(1, roadmap.modules().size());
        List<CourseRoadmapDto.LessonItem> lessons =
                roadmap.modules().get(0).lessons();
        assertTrue(lessons.get(0).completed());
        assertTrue(lessons.get(0).hasContent());
        assertTrue(lessons.get(1).canAccess());
        assertTrue(lessons.get(1).hasContent());
        assertFalse(lessons.get(2).canAccess());
        assertFalse(lessons.get(2).hasContent());
        verify(lessonRepository).findRoadmapLessonsByCourseId(course.getId());
        verify(accessService).requireAccess(user, course);
    }

    private Lesson lesson(
            Long id,
            String title,
            int orderIndex,
            CourseModule module
    ) {
        Lesson lesson = new Lesson();
        lesson.setId(id);
        lesson.setTitle(title);
        lesson.setOrderIndex(orderIndex);
        lesson.setModule(module);
        lesson.setPublished(true);
        return lesson;
    }
}

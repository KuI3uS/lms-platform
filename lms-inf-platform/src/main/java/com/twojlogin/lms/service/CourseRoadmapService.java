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
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class CourseRoadmapService {

    private final CourseRepository courseRepository;
    private final CourseModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository progressRepository;
    private final CourseAccessService accessService;

    public CourseRoadmapService(
            CourseRepository courseRepository,
            CourseModuleRepository moduleRepository,
            LessonRepository lessonRepository,
            LessonProgressRepository progressRepository,
            CourseAccessService accessService
    ) {
        this.courseRepository = courseRepository;
        this.moduleRepository = moduleRepository;
        this.lessonRepository = lessonRepository;
        this.progressRepository = progressRepository;
        this.accessService = accessService;
    }

    @Transactional(readOnly = true)
    public CourseRoadmapDto getRoadmap(
            Long courseId,
            Authentication authentication
    ) {
        User user = accessService.currentUser(authentication);
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Kurs nie istnieje"
                ));
        accessService.requireAccess(user, course);

        List<CourseModule> modules =
                moduleRepository.findByCourseIdOrderByIdAsc(courseId);
        List<Lesson> lessons =
                lessonRepository.findRoadmapLessonsByCourseId(courseId);
        Set<Long> completedLessonIds = Set.copyOf(
                progressRepository.findCompletedLessonIdsByUserIdAndCourseId(
                        user.getId(),
                        courseId
                )
        );

        Map<Long, List<Lesson>> lessonsByModule = new HashMap<>();
        for (Lesson lesson : lessons) {
            lessonsByModule.computeIfAbsent(
                    lesson.getModule().getId(),
                    ignored -> new java.util.ArrayList<>()
            ).add(lesson);
        }

        boolean admin = accessService.isAdmin(user);
        List<CourseRoadmapDto.ModuleItem> moduleItems = modules.stream()
                .map(module -> toModuleItem(
                        module,
                        lessonsByModule.getOrDefault(module.getId(), List.of()),
                        completedLessonIds,
                        admin
                ))
                .toList();

        return new CourseRoadmapDto(
                course.getId(),
                course.getName(),
                course.getTitle(),
                course.getCategory(),
                course.getCourseLanguage(),
                course.getCefrLevel(),
                moduleItems
        );
    }

    private CourseRoadmapDto.ModuleItem toModuleItem(
            CourseModule module,
            List<Lesson> lessons,
            Set<Long> completedLessonIds,
            boolean admin
    ) {
        boolean unrestricted = admin || !module.isLessonsLocked();
        List<CourseRoadmapDto.LessonItem> lessonItems =
                java.util.stream.IntStream.range(0, lessons.size())
                        .mapToObj(index -> {
                            Lesson lesson = lessons.get(index);
                            boolean completed =
                                    completedLessonIds.contains(lesson.getId());
                            boolean previousCompleted = index == 0
                                    || completedLessonIds.contains(
                                    lessons.get(index - 1).getId()
                            );
                            boolean canAccess = lesson.isFreePreview()
                                    || unrestricted
                                    || previousCompleted;

                            return new CourseRoadmapDto.LessonItem(
                                    lesson.getId(),
                                    lesson.getTitle(),
                                    lesson.getOrderIndex(),
                                    completed,
                                    canAccess
                            );
                        })
                        .toList();

        return new CourseRoadmapDto.ModuleItem(
                module.getId(),
                module.getName(),
                module.isLessonsLocked(),
                lessonItems
        );
    }
}

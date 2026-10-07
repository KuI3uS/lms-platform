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
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import com.twojlogin.lms.util.CefrLevels;

@Service
public class CourseRoadmapService {

    private final CourseRepository courseRepository;
    private final CourseModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final LessonBlockRepository blockRepository;
    private final LessonProgressRepository progressRepository;
    private final CourseAccessService accessService;

    public CourseRoadmapService(
            CourseRepository courseRepository,
            CourseModuleRepository moduleRepository,
            LessonRepository lessonRepository,
            LessonBlockRepository blockRepository,
            LessonProgressRepository progressRepository,
            CourseAccessService accessService
    ) {
        this.courseRepository = courseRepository;
        this.moduleRepository = moduleRepository;
        this.lessonRepository = lessonRepository;
        this.blockRepository = blockRepository;
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
        Map<Long, Long> publishedBlockCounts = new HashMap<>();
        if (!lessons.isEmpty()) {
            for (Object[] row : blockRepository.countPublishedByLessonIds(
                    lessons.stream().map(Lesson::getId).toList()
            )) {
                publishedBlockCounts.put(
                        ((Number) row[0]).longValue(),
                        ((Number) row[1]).longValue()
                );
            }
        }

        Map<Long, List<Lesson>> lessonsByModule = new HashMap<>();
        for (Lesson lesson : lessons) {
            lessonsByModule.computeIfAbsent(
                    lesson.getModule().getId(),
                    ignored -> new java.util.ArrayList<>()
            ).add(lesson);
        }

        boolean admin = accessService.isAdmin(user);
        String unlockedCefrLevel = "LANGUAGE".equals(course.getCategory())
                ? accessService.unlockedCefrLevel(user, course)
                : null;
        List<CourseRoadmapDto.ModuleItem> moduleItems = modules.stream()
                .map(module -> toModuleItem(
                        module,
                        lessonsByModule.getOrDefault(module.getId(), List.of()),
                        completedLessonIds,
                        publishedBlockCounts,
                        admin,
                        admin
                                || !"LANGUAGE".equals(course.getCategory())
                                || CefrLevels.rank(module.getCefrLevel())
                                <= CefrLevels.rank(unlockedCefrLevel)
                ))
                .toList();

        return new CourseRoadmapDto(
                course.getId(),
                course.getName(),
                course.getTitle(),
                course.getCategory(),
                course.getCourseLanguage(),
                course.getCefrLevel(),
                course.getCefrEndLevel(),
                unlockedCefrLevel,
                moduleItems
        );
    }

    private CourseRoadmapDto.ModuleItem toModuleItem(
            CourseModule module,
            List<Lesson> lessons,
            Set<Long> completedLessonIds,
            Map<Long, Long> publishedBlockCounts,
            boolean admin,
            boolean levelUnlocked
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
                            boolean hasContent = lesson.isPublished()
                                    && publishedBlockCounts.getOrDefault(
                                    lesson.getId(), 0L
                            ) > 0;
                            boolean canAccess = admin || hasContent && (
                                    lesson.isFreePreview()
                                            || levelUnlocked
                                            && (unrestricted || previousCompleted)
                            );

                            return new CourseRoadmapDto.LessonItem(
                                    lesson.getId(),
                                    lesson.getTitle(),
                                    lesson.getOrderIndex(),
                                    completed,
                                    canAccess,
                                    hasContent
                            );
                        })
                        .toList();

        return new CourseRoadmapDto.ModuleItem(
                module.getId(),
                module.getName(),
                module.isLessonsLocked(),
                module.getCefrLevel(),
                levelUnlocked,
                lessonItems
        );
    }
}

package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.LessonDto;
import com.twojlogin.lms.entity.*;
import com.twojlogin.lms.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import com.twojlogin.lms.service.CourseAccessService;
import com.twojlogin.lms.service.GamificationService;
import com.twojlogin.lms.service.ProgressRewardService;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/lessons")
public class LessonController {

    private final LessonRepository lessonRepository;
    private final CourseModuleRepository moduleRepository;


    private final LessonSubmissionRepository lessonSubmissionRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final UserRepository userRepository;
    private final TaskAttemptRepository taskAttemptRepository;
    private final LessonBlockRepository lessonBlockRepository;
    private final CourseAccessService courseAccessService;
    private final ProgressRewardService rewardService;
    private final LanguageReviewProgressRepository reviewRepository;

    public LessonController(
            LessonRepository lessonRepository,
            CourseModuleRepository moduleRepository, LessonSubmissionRepository lessonSubmissionRepository,
            LessonProgressRepository lessonProgressRepository,
            UserRepository userRepository,
            TaskAttemptRepository taskAttemptRepository,
            LessonBlockRepository lessonBlockRepository,
            CourseAccessService courseAccessService,
            ProgressRewardService rewardService,
            LanguageReviewProgressRepository reviewRepository
    ) {
        this.lessonRepository = lessonRepository;
        this.moduleRepository = moduleRepository;
        this.lessonSubmissionRepository = lessonSubmissionRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.userRepository = userRepository;
        this.taskAttemptRepository = taskAttemptRepository;
        this.lessonBlockRepository = lessonBlockRepository;
        this.courseAccessService = courseAccessService;
        this.rewardService = rewardService;
        this.reviewRepository = reviewRepository;
    }


    // CREATE
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/module/{moduleId}")
    public LessonDto create(@PathVariable Long moduleId,
                         @RequestBody Lesson lesson) {

        CourseModule module = moduleRepository.findById(moduleId)
                .orElseThrow();

        lesson.setModule(module);
        return new LessonDto(lessonRepository.save(lesson));
    }

    // GET lessons
    @GetMapping("/module/{moduleId}")
    public List<LessonDto> getByModule(
            @PathVariable Long moduleId,
            Authentication authentication
    ) {
        User user = courseAccessService.currentUser(authentication);
        CourseModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Moduł nie istnieje"
                ));
        courseAccessService.requireAccess(user, module.getCourse());

        List<Lesson> lessons = lessonRepository.findByModuleIdOrderByOrderIndexAsc(moduleId);
        Set<Long> completedLessonIds = Set.copyOf(
                lessonProgressRepository.findCompletedLessonIdsByUserIdAndModuleId(
                        user.getId(),
                        moduleId
                )
        );
        boolean unrestricted = courseAccessService.isAdmin(user) || !module.isLessonsLocked();

        return java.util.stream.IntStream.range(0, lessons.size())
                .mapToObj(index -> {
                    Lesson lesson = lessons.get(index);
                    boolean completed = completedLessonIds.contains(lesson.getId());
                    boolean previousCompleted = index == 0
                            || completedLessonIds.contains(lessons.get(index - 1).getId());
                    boolean canAccess = lesson.isFreePreview()
                            || unrestricted
                            || previousCompleted;

                    return new LessonDto(lesson, completed, canAccess);
                })
                .toList();
    }

    // DELETE lesson
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {

        List<LessonSubmission> submissions = lessonSubmissionRepository.findByLessonId(id);
        lessonSubmissionRepository.deleteAll(submissions);

        taskAttemptRepository.deleteByBlockLessonId(id);
        reviewRepository.deleteByBlockLessonId(id);
        lessonProgressRepository.deleteByLessonId(id);

        lessonRepository.deleteById(id);
    }
    // UPDATE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public LessonDto update(@PathVariable Long id,
                         @RequestBody Lesson updated) {

        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow();

        lesson.setTitle(updated.getTitle());
        lesson.setTheory(updated.getTheory());
        lesson.setExample(updated.getExample());
        lesson.setOrderIndex(updated.getOrderIndex());
        lesson.setContent(updated.getContent());
        lesson.setImageUrl(updated.getImageUrl());
        lesson.setPublished(updated.isPublished());
        lesson.setFreePreview(updated.isFreePreview());

        return new LessonDto(lessonRepository.save(lesson));
    }

    @GetMapping("/{id}")
    public LessonDto getOne(@PathVariable Long id, Authentication authentication) {
        Lesson lesson = courseAccessService.requireLessonAccess(id, authentication);
        return new LessonDto(lesson);
    }

    @GetMapping("/{id}/access")
    public boolean canAccessLesson(@PathVariable Long id, Authentication authentication) {

        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));

        if (lesson.isFreePreview()) {
            return true;
        }
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow();

        if (!courseAccessService.hasAccess(user, lesson.getModule().getCourse())) {
            return false;
        }
        if (!lesson.getModule().isLessonsLocked()) {
            return true;
        }

        Optional<Lesson> previousLesson =
                lessonRepository.findFirstByModuleIdAndOrderIndexLessThanOrderByOrderIndexDesc(
                        lesson.getModule().getId(),
                        lesson.getOrderIndex()
                );
        if (previousLesson.isEmpty()) {
            return true;
        }
        return lessonProgressRepository.existsByUserAndLessonAndCompletedTrue(
                user,
                previousLesson.get()
        );
    }

    @PostMapping("/{id}/complete")
    public Map<String, Object> completeLesson(
            @PathVariable Long id,
            Authentication authentication
    ) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow();

        Lesson lesson = courseAccessService.requireLessonAccess(id, authentication);

        long requiredTasks =
                lessonBlockRepository.countRequiredAssessmentsByLessonId(
                        lesson.getId()
                );
        long correctTasks =
                taskAttemptRepository.countCorrectAssessmentsByUserAndLesson(
                        user.getId(),
                        lesson.getId()
                );

        if (correctTasks < requiredTasks) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Najpierw popraw wszystkie zadania w tej lekcji"
            );
        }

        LessonProgress progress = lessonProgressRepository
                .findByUserAndLesson(user, lesson)
                .orElse(new LessonProgress());

        boolean newlyCompleted = !progress.isCompleted();
        progress.setUser(user);
        progress.setLesson(lesson);
        if (!progress.isCompleted() || progress.getCompletedAt() == null) {
            progress.setCompletedAt(LocalDateTime.now());
        }
        progress.setCompleted(true);

        lessonProgressRepository.save(progress);
        GamificationService.AwardResult award = null;
        if (newlyCompleted) {
            award = rewardService.afterLessonCompleted(user, lesson);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("completed", true);
        response.put("lessonId", lesson.getId());
        response.put("newlyCompleted", newlyCompleted);
        response.put("xpEarned", award == null ? 0 : award.xpEarned());
        response.put("gemsEarned", award == null ? 0 : award.gemsEarned());
        response.put("gemBalance", award == null ? null : award.gemBalance());
        response.put("level", award == null ? null : award.level());
        response.put("levelUp", award != null && award.levelUp());
        return response;
    }
}

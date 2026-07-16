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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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

    public LessonController(
            LessonRepository lessonRepository,
            CourseModuleRepository moduleRepository, LessonSubmissionRepository lessonSubmissionRepository,
            LessonProgressRepository lessonProgressRepository,
            UserRepository userRepository,
            TaskAttemptRepository taskAttemptRepository,
            LessonBlockRepository lessonBlockRepository
    ) {
        this.lessonRepository = lessonRepository;
        this.moduleRepository = moduleRepository;
        this.lessonSubmissionRepository = lessonSubmissionRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.userRepository = userRepository;
        this.taskAttemptRepository = taskAttemptRepository;
        this.lessonBlockRepository = lessonBlockRepository;
    }


    // CREATE
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/module/{moduleId}")
    public Lesson create(@PathVariable Long moduleId,
                         @RequestBody Lesson lesson) {

        CourseModule module = moduleRepository.findById(moduleId)
                .orElseThrow();

        lesson.setModule(module);
        return lessonRepository.save(lesson);
    }

    // GET lessons
    @GetMapping("/module/{moduleId}")
    public List<LessonDto> getByModule(
            @PathVariable Long moduleId,
            Authentication authentication
    ) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow();

        return lessonRepository.findByModuleIdOrderByOrderIndexAsc(moduleId).stream()
                .map(lesson -> new LessonDto(
                        lesson,
                        lessonProgressRepository.existsByUserAndLessonAndCompletedTrue(user, lesson)
                ))
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
        lessonProgressRepository.deleteByLessonId(id);

        lessonRepository.deleteById(id);
    }
    // UPDATE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public Lesson update(@PathVariable Long id,
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

        return lessonRepository.save(lesson);
    }

    @GetMapping("/{id}")
    public java.util.Map<String, Object> getOne(@PathVariable Long id) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));

        java.util.Map<String, Object> result = new java.util.HashMap<>();

        result.put("id", lesson.getId());
        result.put("title", lesson.getTitle());
        result.put("theory", lesson.getTheory());
        result.put("example", lesson.getExample());
        result.put("content", lesson.getContent());
        result.put("imageUrl", lesson.getImageUrl());
        result.put("freePreview", lesson.isFreePreview());
        result.put("published", lesson.isPublished());
        result.put("orderIndex", lesson.getOrderIndex());

        if (lesson.getModule() != null) {
            result.put("moduleId", lesson.getModule().getId());
        } else {
            result.put("moduleId", null);
        }

        return result;
    }

    @GetMapping("/{id}/access")
    public boolean canAccessLesson(@PathVariable Long id, Authentication authentication) {

        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));

        if (!lesson.getModule().isLessonsLocked()) {
            return true;
        }
        if (lesson.isFreePreview()) {
            return true;
        }
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow();

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

        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow();

        long requiredTasks = lessonBlockRepository.countByLessonIdAndTypeAndPublishedTrue(
                lesson.getId(),
                BlockType.TASK
        );
        long correctTasks = taskAttemptRepository.countCorrectTasksByUserAndLesson(
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

        progress.setUser(user);
        progress.setLesson(lesson);
        progress.setCompleted(true);
        progress.setCompletedAt(LocalDateTime.now());

        lessonProgressRepository.save(progress);

        return Map.of(
                "completed", true,
                "lessonId", lesson.getId()
        );
    }
}

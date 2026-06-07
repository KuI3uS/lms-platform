package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.LessonDto;
import com.twojlogin.lms.entity.CourseModule;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.entity.LessonProgress;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.CourseModuleRepository;
import com.twojlogin.lms.repository.LessonProgressRepository;
import com.twojlogin.lms.repository.LessonRepository;
import com.twojlogin.lms.repository.UserRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/lessons")
public class LessonController {

    private final LessonRepository lessonRepository;
    private final CourseModuleRepository moduleRepository;

    private final LessonProgressRepository lessonProgressRepository;
    private final UserRepository userRepository;

    public LessonController(
            LessonRepository lessonRepository,
            CourseModuleRepository moduleRepository,
            LessonProgressRepository lessonProgressRepository,
            UserRepository userRepository
    ) {
        this.lessonRepository = lessonRepository;
        this.moduleRepository = moduleRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.userRepository = userRepository;
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
    public List<Lesson> getByModule(@PathVariable Long moduleId) {
        return lessonRepository.findByModuleIdOrderByOrderIndexAsc(moduleId);
    }

    // DELETE lesson
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
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
    public LessonDto getOne(@PathVariable Long id) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));

        return new LessonDto(lesson);
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
    public LessonProgress completeLesson(
            @PathVariable Long id,
            Authentication authentication
    ) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow();

        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow();

        LessonProgress progress = lessonProgressRepository
                .findByUserAndLesson(user, lesson)
                .orElse(new LessonProgress());

        progress.setUser(user);
        progress.setLesson(lesson);
        progress.setCompleted(true);
        progress.setCompletedAt(LocalDateTime.now());

        return lessonProgressRepository.save(progress);
    }
}
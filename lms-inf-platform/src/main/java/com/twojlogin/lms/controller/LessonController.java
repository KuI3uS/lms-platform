package com.twojlogin.lms.controller;

import com.twojlogin.lms.entity.CourseModule;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.repository.CourseModuleRepository;
import com.twojlogin.lms.repository.LessonRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lessons")
public class LessonController {

    private final LessonRepository lessonRepository;
    private final CourseModuleRepository moduleRepository;

    public LessonController(LessonRepository lessonRepository,
                            CourseModuleRepository moduleRepository) {
        this.lessonRepository = lessonRepository;
        this.moduleRepository = moduleRepository;
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

        return lessonRepository.save(lesson);
    }

    @GetMapping("/{id}")
    public Lesson getOne(@PathVariable Long id) {
        return lessonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lesson not found"));
    }
}
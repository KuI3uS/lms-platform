package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.AnswerRequest;
import com.twojlogin.lms.entity.CourseModule;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.entity.Task;
import com.twojlogin.lms.repository.CourseModuleRepository;
import com.twojlogin.lms.repository.LessonRepository;
import com.twojlogin.lms.repository.TaskRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.twojlogin.lms.repository.LessonBlockRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskRepository taskRepository;
    private final LessonRepository lessonRepository;
    private final LessonBlockRepository lessonBlockRepository;

    public TaskController(TaskRepository taskRepository,
                          LessonRepository lessonRepository, LessonBlockRepository lessonBlockRepository) {
        this.taskRepository = taskRepository;
        this.lessonRepository = lessonRepository;
        this.lessonBlockRepository = lessonBlockRepository;
    }

    // 🔥 CREATE
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/lesson/{lessonId}")
    public Task create(@PathVariable Long lessonId,
                       @RequestBody Task task) {

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow();

        // 🔥 KLUCZOWE
        int nextOrder = taskRepository.countByLessonId(lessonId);
        task.setOrderIndex(nextOrder);

        task.setType(task.getType() == null ? "TEXT" : task.getType());
        task.setLanguage(task.getLanguage());
        task.setStarterCode(task.getStarterCode());
        task.setHint(task.getHint());

        task.setLesson(lesson);
        return taskRepository.save(task);
    }

    // 🔥 GET tasks
    @GetMapping("/lesson/{lessonId}")
    public List<Task> getByLesson(@PathVariable Long lessonId) {
        return taskRepository.findByLessonIdOrderByOrderIndexAsc(lessonId);
    }
    // 🔥 DELETE
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        lessonBlockRepository.deleteAll(lessonBlockRepository.findByTaskId(id));
        taskRepository.deleteById(id);
    }

    // 🔥 UPDATE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public Task update(@PathVariable Long id,
                       @RequestBody Task updated) {

        Task task = taskRepository.findById(id)
                .orElseThrow();

        task.setTaskContent(updated.getTaskContent());
        task.setExpectedAnswer(updated.getExpectedAnswer());
        task.setStarterCode(updated.getStarterCode());
        task.setHint(updated.getHint());
        task.setLanguage(updated.getLanguage());
        task.setType(updated.getType());
        task.setOrderIndex(updated.getOrderIndex());


        return taskRepository.save(task);
    }

    // 🔥 CHECK ANSWER
    @PostMapping("/{id}/check")
    public Map<String, Object> checkAnswer(@PathVariable Long id,
                                           @RequestBody AnswerRequest request) {

        Task task = taskRepository.findById(id)
                .orElseThrow();

        if (request.getAnswer() == null) {
            return Map.of(
                    "correct", false,
                    "message", "Nie przesłano odpowiedzi."
            );
        }

        String studentCode = normalizeCode(request.getAnswer());
        String expected = task.getExpectedAnswer() == null ? "" : task.getExpectedAnswer();

        String[] requiredParts = expected.split("\\n");

        List<String> missing = new ArrayList<>();

        for (String part : requiredParts) {
            if (part == null || part.isBlank()) continue;

            String normalizedPart = normalizeCode(part);

            if (!studentCode.contains(normalizedPart)) {
                missing.add(part.trim());
            }
        }

        boolean correct = missing.isEmpty();

        if (correct) {
            return Map.of(
                    "correct", true,
                    "message", "Poprawna odpowiedź."
            );
        }

        return Map.of(
                "correct", false,
                "message", "Kod nie zawiera wszystkich wymaganych elementów.",
                "missing", missing
        );
    }

    private String normalizeCode(String code) {
        return code
                .replaceAll("\\s+", "")
                .replace("'", "\"")
                .toLowerCase();
    }

}
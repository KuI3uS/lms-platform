package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.AnswerRequest;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.entity.Task;
import com.twojlogin.lms.repository.LessonBlockRepository;
import com.twojlogin.lms.repository.LessonRepository;
import com.twojlogin.lms.repository.TaskRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskRepository taskRepository;
    private final LessonRepository lessonRepository;
    private final LessonBlockRepository lessonBlockRepository;

    public TaskController(
            TaskRepository taskRepository,
            LessonRepository lessonRepository,
            LessonBlockRepository lessonBlockRepository
    ) {
        this.taskRepository = taskRepository;
        this.lessonRepository = lessonRepository;
        this.lessonBlockRepository = lessonBlockRepository;
    }

    // ============================================================
    // CREATE
    // ============================================================

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/lesson/{lessonId}")
    public Task create(
            @PathVariable Long lessonId,
            @RequestBody Task task
    ) {

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow();

        task.setLesson(lesson);

        task.setOrderIndex(
                taskRepository.countByLessonId(lessonId)
        );

        if (task.getType() == null) {
            task.setType("CODE");
        }

        if (task.getLanguage() == null) {
            task.setLanguage("java");
        }

        if (task.getPublished() == null) {
            task.setPublished(true);
        }

        if (task.getPoints() == null) {
            task.setPoints(0);
        }

        return taskRepository.save(task);
    }

    // ============================================================
    // GET
    // ============================================================

    @GetMapping("/lesson/{lessonId}")
    public List<Task> getByLesson(
            @PathVariable Long lessonId
    ) {

        return taskRepository.findByLessonIdOrderByOrderIndexAsc(lessonId);

    }

    // ============================================================
    // UPDATE
    // ============================================================

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public Task update(
            @PathVariable Long id,
            @RequestBody Task updated
    ) {

        Task task = taskRepository.findById(id)
                .orElseThrow();

        task.setTitle(updated.getTitle());

        task.setDescription(updated.getDescription());

        task.setInstruction(updated.getInstruction());

        task.setExpectedAnswer(updated.getExpectedAnswer());

        task.setStarterCode(updated.getStarterCode());

        task.setHint(updated.getHint());

        task.setLanguage(updated.getLanguage());

        task.setType(updated.getType());

        task.setPoints(updated.getPoints());

        task.setPublished(updated.getPublished());

        task.setOrderIndex(updated.getOrderIndex());

        return taskRepository.save(task);
    }

    // ============================================================
    // DELETE
    // ============================================================

    @PreAuthorize("hasRole(" + "\"ADMIN\"" + ")")
    @DeleteMapping("/{id}")
    public void delete(
            @PathVariable Long id
    ) {

        lessonBlockRepository.deleteAll(
                lessonBlockRepository.findByTaskId(id)
        );

        taskRepository.deleteById(id);
    }

    // ============================================================
    // CHECK ANSWER
    // ============================================================

    @PostMapping("/{id}/check")
    public Map<String, Object> checkAnswer(
            @PathVariable Long id,
            @RequestBody AnswerRequest request
    ) {

        Task task = taskRepository.findById(id)
                .orElseThrow();

        if (request.getAnswer() == null) {

            return Map.of(
                    "correct", false,
                    "message", "Nie przesłano odpowiedzi."
            );

        }

        String studentCode = normalizeCode(request.getAnswer());

        String expected = task.getExpectedAnswer() == null
                ? ""
                : task.getExpectedAnswer();

        String[] requiredParts = expected.split("\\n");

        List<String> missing = new ArrayList<>();

        for (String part : requiredParts) {

            if (part == null || part.isBlank()) {
                continue;
            }

            String normalized = normalizeCode(part);

            if (!studentCode.contains(normalized)) {
                missing.add(part.trim());
            }
        }

        if (missing.isEmpty()) {

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

    // ============================================================
    // HELPERS
    // ============================================================

    private String normalizeCode(String code) {

        return code
                .replaceAll("\\s+", "")
                .replace("'", "\"")
                .toLowerCase();

    }

}
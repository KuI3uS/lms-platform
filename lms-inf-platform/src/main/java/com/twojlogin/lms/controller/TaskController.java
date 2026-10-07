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

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskRepository taskRepository;
    private final LessonRepository lessonRepository;

    public TaskController(TaskRepository taskRepository,
                          LessonRepository lessonRepository) {
        this.taskRepository = taskRepository;
        this.lessonRepository = lessonRepository;
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
    public boolean checkAnswer(@PathVariable Long id,
                               @RequestBody AnswerRequest request) {

        Task task = taskRepository.findById(id)
                .orElseThrow();

        if (request.getAnswer() == null) return false;

        String expected = task.getExpectedAnswer() == null ? "" : task.getExpectedAnswer();

        return expected.trim()
                .equalsIgnoreCase(request.getAnswer().trim());
    }

}
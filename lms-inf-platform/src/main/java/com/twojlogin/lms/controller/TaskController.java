package com.twojlogin.lms.controller;

import com.twojlogin.lms.entity.CourseModule;
import com.twojlogin.lms.entity.Task;
import com.twojlogin.lms.repository.CourseModuleRepository;
import com.twojlogin.lms.repository.TaskRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskRepository taskRepository;
    private final CourseModuleRepository moduleRepository;

    public TaskController(TaskRepository taskRepository,
                          CourseModuleRepository moduleRepository) {
        this.taskRepository = taskRepository;
        this.moduleRepository = moduleRepository;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/module/{moduleId}")
    public Task create(@PathVariable Long moduleId,
                       @RequestBody Task task) {

        CourseModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module not found"));

        task.setModule(module);
        return taskRepository.save(task);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/module/{moduleId}")
    public List<Task> getByModule(@PathVariable Long moduleId) {
        return taskRepository.findByModuleIdOrderByOrderIndexAsc(moduleId);
    }

    @GetMapping("/{id}")
    public Task getOne(@PathVariable Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        taskRepository.deleteById(id);
    }

    @PostMapping("/{id}/check")
    public boolean checkAnswer(@PathVariable Long id,
                               @RequestBody String answer) {

        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        String expected = task.getExpectedAnswer().trim().toLowerCase();
        String user = answer.trim().toLowerCase();

        return expected.equals(user);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public Task update(@PathVariable Long id, @RequestBody Task updated) {

        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        task.setTitle(updated.getTitle());
        task.setTheory(updated.getTheory());
        task.setExample(updated.getExample());
        task.setTaskContent(updated.getTaskContent());
        task.setExpectedAnswer(updated.getExpectedAnswer());
        task.setTaskType(updated.getTaskType());
        task.setOrderIndex(updated.getOrderIndex());

        return taskRepository.save(task);
    }

}
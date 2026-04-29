package com.twojlogin.lms.controller;

import com.twojlogin.lms.entity.CourseModule;
import com.twojlogin.lms.entity.Task;
import com.twojlogin.lms.repository.CourseModuleRepository;
import com.twojlogin.lms.repository.TaskRepository;
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


    @PostMapping("/module/{moduleId}")
    public Task create(@PathVariable Long moduleId,
                       @RequestBody Task task) {

        CourseModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module not found"));

        task.setModule(module);
        return taskRepository.save(task);
    }


    @GetMapping("/module/{moduleId}")
    public List<Task> getByModule(@PathVariable Long moduleId) {
        return taskRepository.findByModuleId(moduleId);
    }
}
package com.twojlogin.lms.controller;

import com.twojlogin.lms.entity.Course;
import com.twojlogin.lms.entity.CourseModule;
import com.twojlogin.lms.repository.CourseModuleRepository;
import com.twojlogin.lms.repository.CourseRepository;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/modules")
public class ModuleController {

    private final CourseModuleRepository moduleRepository;
    private final CourseRepository courseRepository;

    public ModuleController(CourseModuleRepository moduleRepository, CourseRepository courseRepository) {
        this.moduleRepository = moduleRepository;
        this.courseRepository = courseRepository;
    }

    @PostMapping("/{courseId}")
    public CourseModule create(@PathVariable Long courseId, @RequestBody CourseModule module) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        module.setCourse(course);
        return moduleRepository.save(module);
    }
}
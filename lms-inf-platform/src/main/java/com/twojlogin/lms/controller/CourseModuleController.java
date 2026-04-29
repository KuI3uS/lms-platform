package com.twojlogin.lms.controller;

import com.twojlogin.lms.entity.Course;
import com.twojlogin.lms.entity.CourseModule;
import com.twojlogin.lms.repository.CourseModuleRepository;
import com.twojlogin.lms.repository.CourseRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/modules")
public class CourseModuleController {

    private final CourseModuleRepository moduleRepository;
    private final CourseRepository courseRepository;

    public CourseModuleController(CourseModuleRepository moduleRepository,
                                  CourseRepository courseRepository) {
        this.moduleRepository = moduleRepository;
        this.courseRepository = courseRepository;
    }

    @PostMapping("/course/{courseId}")
    public CourseModule create(@PathVariable Long courseId,
                               @RequestBody CourseModule module) {

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        module.setCourse(course);
        return moduleRepository.save(module);
    }

    @GetMapping("/course/{courseId}")
    public List<CourseModule> getByCourse(@PathVariable Long courseId) {
        return moduleRepository.findByCourseId(courseId);
    }
}
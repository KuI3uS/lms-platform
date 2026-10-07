package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.CourseModuleDto;
import com.twojlogin.lms.entity.Course;
import com.twojlogin.lms.entity.CourseModule;
import com.twojlogin.lms.repository.CourseModuleRepository;
import com.twojlogin.lms.repository.CourseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.List;
import org.springframework.security.core.Authentication;
import com.twojlogin.lms.service.CourseAccessService;

@RestController
@RequestMapping("/api/modules")
public class CourseModuleController {

    private final CourseModuleRepository moduleRepository;
    private final CourseRepository courseRepository;
    private final CourseAccessService accessService;

    public CourseModuleController(CourseModuleRepository moduleRepository,
                                  CourseRepository courseRepository,
                                  CourseAccessService accessService) {
        this.moduleRepository = moduleRepository;
        this.courseRepository = courseRepository;
        this.accessService = accessService;
    }

    @PostMapping("/course/{courseId}")
    @PreAuthorize("hasRole('ADMIN')")
    public CourseModuleDto create(@PathVariable Long courseId,
                               @RequestBody CourseModule module) {

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        module.setCourse(course);
        return CourseModuleDto.from(moduleRepository.save(module));
    }

    @GetMapping("/course/{courseId}")
    public List<CourseModuleDto> getByCourse(
            @PathVariable Long courseId,
            Authentication authentication
    ) {
        accessService.requireCourseAccess(courseId, authentication);
        return moduleRepository.findByCourseId(courseId).stream()
                .map(CourseModuleDto::from)
                .toList();
    }


    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            moduleRepository.deleteById(id);
            return ResponseEntity.ok().build();

        } catch (DataIntegrityViolationException e) {
            return ResponseEntity
                    .badRequest()
                    .body("Nie możesz usunąć modułu — najpierw usuń zadania");
        }
    }

    @GetMapping("/{id}")
    public CourseModuleDto getOne(
            @PathVariable Long id,
            Authentication authentication
    ) {
        accessService.requireModuleAccess(id, authentication);
        return CourseModuleDto.from(moduleRepository.findById(id).orElseThrow());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CourseModuleDto update(@PathVariable Long id, @RequestBody CourseModule updated) {
        CourseModule module = moduleRepository.findById(id).orElseThrow();

        module.setName(updated.getName());
        module.setLessonsLocked(updated.isLessonsLocked());

        return CourseModuleDto.from(moduleRepository.save(module));
    }
}

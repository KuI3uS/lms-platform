package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.CourseModuleDto;
import com.twojlogin.lms.dto.CourseRoadmapDto;
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
import com.twojlogin.lms.service.CourseRoadmapService;
import com.twojlogin.lms.util.CefrLevels;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/modules")
public class CourseModuleController {

    private final CourseModuleRepository moduleRepository;
    private final CourseRepository courseRepository;
    private final CourseAccessService accessService;
    private final CourseRoadmapService roadmapService;

    public CourseModuleController(CourseModuleRepository moduleRepository,
                                  CourseRepository courseRepository,
                                  CourseAccessService accessService,
                                  CourseRoadmapService roadmapService) {
        this.moduleRepository = moduleRepository;
        this.courseRepository = courseRepository;
        this.accessService = accessService;
        this.roadmapService = roadmapService;
    }

    @GetMapping("/course/{courseId}/roadmap")
    public CourseRoadmapDto getRoadmap(
            @PathVariable Long courseId,
            Authentication authentication
    ) {
        return roadmapService.getRoadmap(courseId, authentication);
    }

    @PostMapping("/course/{courseId}")
    @PreAuthorize("hasRole('ADMIN')")
    public CourseModuleDto create(@PathVariable Long courseId,
                               @RequestBody CourseModule module) {

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        applyCefrLevel(module, course);
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
        applyCefrLevel(
                module,
                module.getCourse(),
                updated.getCefrLevel() == null
                        ? module.getCefrLevel()
                        : updated.getCefrLevel()
        );

        return CourseModuleDto.from(moduleRepository.save(module));
    }

    private void applyCefrLevel(CourseModule module, Course course) {
        applyCefrLevel(module, course, module.getCefrLevel());
    }

    private void applyCefrLevel(CourseModule module, Course course, String requestedLevel) {
        if (!"LANGUAGE".equals(course.getCategory())) {
            module.setCefrLevel(null);
            return;
        }

        String level = CefrLevels.normalize(requestedLevel);
        if (level == null) level = course.getCefrLevel();
        if (!CefrLevels.isInRange(level, course.getCefrLevel(), course.getCefrEndLevel())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Poziom modułu musi mieścić się w zakresie kursu"
            );
        }
        module.setCefrLevel(level);
    }
}

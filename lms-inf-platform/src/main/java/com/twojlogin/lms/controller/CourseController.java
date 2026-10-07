package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.CourseRequest;
import com.twojlogin.lms.dto.CourseSummaryDto;
import com.twojlogin.lms.service.CourseService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;

    public CourseController(CourseService courseService) {
        this.courseService = courseService;
    }

    @GetMapping
    public List<CourseSummaryDto> getAll(Authentication authentication) {
        return courseService.getAll(authentication);
    }

    @GetMapping("/my")
    public List<CourseSummaryDto> myCourses(Authentication authentication) {
        return courseService.getMy(authentication);
    }

    @GetMapping("/{id}")
    public CourseSummaryDto getById(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return courseService.getById(id, authentication);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CourseSummaryDto create(
            @RequestBody CourseRequest request,
            Authentication authentication
    ) {
        return courseService.create(request, authentication);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public CourseSummaryDto update(
            @PathVariable Long id,
            @RequestBody CourseRequest request,
            Authentication authentication
    ) {
        return courseService.update(id, request, authentication);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        courseService.delete(id);
    }
}

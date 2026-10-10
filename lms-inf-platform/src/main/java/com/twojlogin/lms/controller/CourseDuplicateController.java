package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.CourseDuplicatePreview;
import com.twojlogin.lms.service.CourseDuplicateService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/courses/{courseId}/duplicates")
@PreAuthorize("hasRole('ADMIN')")
public class CourseDuplicateController {
    private final CourseDuplicateService service;

    public CourseDuplicateController(CourseDuplicateService service) {
        this.service = service;
    }

    @GetMapping
    public CourseDuplicatePreview preview(@PathVariable Long courseId) {
        return service.preview(courseId);
    }

    @PostMapping("/cleanup")
    public CourseDuplicatePreview cleanup(
            @PathVariable Long courseId, @RequestBody CleanupRequest request
    ) {
        return service.cleanup(courseId, request.version());
    }

    public record CleanupRequest(String version) {}
}

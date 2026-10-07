package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.CurriculumImportReport;
import com.twojlogin.lms.service.CurriculumImportService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/curricula/java-junior")
@PreAuthorize("hasRole('ADMIN')")
public class CurriculumController {

    private final CurriculumImportService importService;

    public CurriculumController(CurriculumImportService importService) {
        this.importService = importService;
    }

    @GetMapping("/course/{courseId}/preview")
    public CurriculumImportReport preview(@PathVariable Long courseId) {
        return importService.preview(courseId);
    }

    @PostMapping("/course/{courseId}/import")
    public CurriculumImportReport importCurriculum(@PathVariable Long courseId) {
        return importService.importIntoEmptyModules(courseId);
    }
}

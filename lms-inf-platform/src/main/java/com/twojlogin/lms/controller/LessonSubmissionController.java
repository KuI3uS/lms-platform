package com.twojlogin.lms.controller;

import com.twojlogin.lms.entity.LessonSubmission;
import com.twojlogin.lms.repository.LessonSubmissionRepository;
import com.twojlogin.lms.util.ClassNameNormalizer;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import org.springframework.web.bind.annotation.DeleteMapping;

import java.util.List;

@RestController
@RequestMapping("/api/admin/submissions")
@PreAuthorize("hasRole('ADMIN')")
public class LessonSubmissionController {

    private final LessonSubmissionRepository submissionRepository;

    public LessonSubmissionController(LessonSubmissionRepository submissionRepository) {
        this.submissionRepository = submissionRepository;
    }

    @GetMapping("/{id}")
    public LessonSubmission getOne(@PathVariable Long id) {
        return submissionRepository.findById(id).orElseThrow();
    }

    @PutMapping("/{id}")
    public LessonSubmission update(
            @PathVariable Long id,
            @RequestBody LessonSubmission updated
    ) {
        LessonSubmission submission = submissionRepository.findById(id)
                .orElseThrow();

        submission.setStatus(updated.getStatus());
        submission.setGrade(updated.getGrade());
        submission.setTeacherComment(updated.getTeacherComment());

        return submissionRepository.save(submission);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        submissionRepository.deleteById(id);
    }

    @GetMapping
    public List<LessonSubmission> getAll(
            @RequestParam(required = false) String className,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String status
    ) {
        if (className != null && !className.isBlank()) {
            return submissionRepository.findByUserSchoolClassNameOrderBySubmittedAtDesc(
                    ClassNameNormalizer.normalize(className)
            );
        }

        if (email != null && !email.isBlank()) {
            return submissionRepository.findByUserEmailContainingIgnoreCaseOrderBySubmittedAtDesc(email);
        }

        if (status != null && !status.isBlank()) {
            return submissionRepository.findByStatusOrderBySubmittedAtDesc(status);
        }

        return submissionRepository.findAllByOrderBySubmittedAtDesc();
    }

    @GetMapping("/my-submissions")
    public List<LessonSubmission> mySubmissions(Authentication authentication) {
        String email = authentication.getName();

        return submissionRepository.findByUserEmailOrderBySubmittedAtDesc(email);
    }
}
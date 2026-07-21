package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.LessonSubmissionDto;
import com.twojlogin.lms.dto.LessonSubmissionUpdateRequest;
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
    public LessonSubmissionDto getOne(@PathVariable Long id) {
        return LessonSubmissionDto.forAdmin(submissionRepository.findById(id).orElseThrow());
    }

    @PutMapping("/{id}")
    public LessonSubmissionDto update(
            @PathVariable Long id,
            @RequestBody LessonSubmissionUpdateRequest updated
    ) {
        LessonSubmission submission = submissionRepository.findById(id)
                .orElseThrow();

        submission.setStatus(updated.status());
        submission.setGrade(updated.grade());
        submission.setTeacherComment(updated.teacherComment());

        return LessonSubmissionDto.forAdmin(submissionRepository.save(submission));
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        submissionRepository.deleteById(id);
    }

    @GetMapping
    public List<LessonSubmissionDto> getAll(
            @RequestParam(required = false) String className,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String status
    ) {
        if (className != null && !className.isBlank()) {
            return toAdminDtos(submissionRepository.findByUserSchoolClassNameOrderBySubmittedAtDesc(
                    ClassNameNormalizer.normalize(className)
            ));
        }

        if (email != null && !email.isBlank()) {
            return toAdminDtos(submissionRepository.findByUserEmailContainingIgnoreCaseOrderBySubmittedAtDesc(email));
        }

        if (status != null && !status.isBlank()) {
            return toAdminDtos(submissionRepository.findByStatusOrderBySubmittedAtDesc(status));
        }

        return toAdminDtos(submissionRepository.findAllByOrderBySubmittedAtDesc());
    }

    @GetMapping("/my-submissions")
    public List<LessonSubmissionDto> mySubmissions(Authentication authentication) {
        String email = authentication.getName();

        return toAdminDtos(submissionRepository.findByUserEmailOrderBySubmittedAtDesc(email));
    }

    private List<LessonSubmissionDto> toAdminDtos(List<LessonSubmission> submissions) {
        return submissions.stream().map(LessonSubmissionDto::forAdmin).toList();
    }
}

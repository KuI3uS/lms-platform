package com.twojlogin.lms.controller;

import com.twojlogin.lms.entity.LessonSubmission;
import com.twojlogin.lms.repository.LessonSubmissionRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/submissions")
@PreAuthorize("hasRole('ADMIN')")
public class LessonSubmissionController {

    private final LessonSubmissionRepository submissionRepository;

    public LessonSubmissionController(LessonSubmissionRepository submissionRepository) {
        this.submissionRepository = submissionRepository;
    }

    @GetMapping
    public List<LessonSubmission> getAll() {
        return submissionRepository.findAllByOrderBySubmittedAtDesc();
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
}
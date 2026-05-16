package com.twojlogin.lms.controller;

import com.twojlogin.lms.entity.LessonSubmission;
import com.twojlogin.lms.repository.LessonSubmissionRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/submissions")
public class StudentSubmissionController {

    private final LessonSubmissionRepository submissionRepository;

    public StudentSubmissionController(LessonSubmissionRepository submissionRepository) {
        this.submissionRepository = submissionRepository;
    }

    @GetMapping("/my")
    public List<LessonSubmission> mySubmissions(Authentication authentication) {
        return submissionRepository.findByUserEmailOrderBySubmittedAtDesc(authentication.getName());
    }
}
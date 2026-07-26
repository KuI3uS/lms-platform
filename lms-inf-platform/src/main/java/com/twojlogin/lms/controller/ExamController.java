package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.ExamAttemptDto;
import com.twojlogin.lms.dto.ExamStartRequest;
import com.twojlogin.lms.dto.ExamSubmitRequest;
import com.twojlogin.lms.service.ExamService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exams")
public class ExamController {

    private final ExamService examService;

    public ExamController(ExamService examService) {
        this.examService = examService;
    }

    @PostMapping("/start")
    @ResponseStatus(HttpStatus.CREATED)
    public ExamAttemptDto start(
            @RequestBody ExamStartRequest request,
            Authentication authentication
    ) {
        return examService.start(request, authentication);
    }

    @GetMapping("/{publicId}")
    public ExamAttemptDto get(
            @PathVariable String publicId,
            Authentication authentication
    ) {
        return examService.get(publicId, authentication);
    }

    @PostMapping("/{publicId}/submit")
    public ExamAttemptDto submit(
            @PathVariable String publicId,
            @RequestBody ExamSubmitRequest request,
            Authentication authentication
    ) {
        return examService.submit(publicId, request, authentication);
    }

    @GetMapping("/history/my")
    public List<ExamAttemptDto> history(Authentication authentication) {
        return examService.history(authentication);
    }
}

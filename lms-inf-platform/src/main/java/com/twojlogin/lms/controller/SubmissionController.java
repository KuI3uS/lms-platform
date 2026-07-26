package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.*;
import com.twojlogin.lms.entity.*;
import com.twojlogin.lms.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import org.springframework.security.core.Authentication;
import com.twojlogin.lms.service.CourseAccessService;
@RestController
@RequestMapping("/api/submit")
public class SubmissionController {

    private final AnswerRepository answerRepository;
    private final SubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final CourseModuleRepository moduleRepository;
    private final CourseAccessService accessService;

    public SubmissionController(AnswerRepository answerRepository,
                                SubmissionRepository submissionRepository,
                                UserRepository userRepository,
                                CourseModuleRepository moduleRepository,
                                CourseAccessService accessService) {
        this.answerRepository = answerRepository;
        this.submissionRepository = submissionRepository;
        this.userRepository = userRepository;
        this.moduleRepository = moduleRepository;
        this.accessService = accessService;
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSubmission(@PathVariable Long id) {
        submissionRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/module/{moduleId}")
    public SubmissionResultDto submit(@PathVariable Long moduleId,
                             @RequestBody SubmitRequest request,
                             Authentication authentication) {

        accessService.requireModuleAccess(moduleId, authentication);

        int total = request.answers.size();
        int correct = 0;

        for (SubmitAnswer a : request.answers) {
            Answer answer = answerRepository.findById(a.answerId)
                    .orElseThrow(() -> new RuntimeException("Answer not found"));

            if (!answer.getQuestion().getId().equals(a.questionId)) {
                throw new RuntimeException("Invalid answer");
            }

            if (answer.isCorrect()) {
                correct++;
            }
        }

        double percentage = (double) correct / total * 100;

        int maxSwitch = 2;
        boolean disqualified = request.tabSwitchCount > maxSwitch;

        if (disqualified) {
            percentage = 0;
        }


        Object principal = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();

        String email;

        if (principal instanceof UserDetails userDetails) {
            email = userDetails.getUsername();
        } else {
            throw new RuntimeException("User not authenticated");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        CourseModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module not found"));

        Submission submission = new Submission();
        submission.setCorrectAnswers(correct);
        submission.setTotalQuestions(total);
        submission.setPercentage(percentage);
        submission.setSubmittedAt(LocalDateTime.now());

        submission.setTabSwitchCount(request.tabSwitchCount);
        submission.setDisqualified(disqualified);

        submission.setUser(user);
        submission.setModule(module);

        return SubmissionResultDto.from(submissionRepository.save(submission));
    }
}

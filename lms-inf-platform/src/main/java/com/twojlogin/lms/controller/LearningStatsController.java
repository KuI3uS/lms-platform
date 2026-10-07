package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.LearningStatsDto;
import com.twojlogin.lms.service.LearningStatsService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/learning-stats")
public class LearningStatsController {

    private final LearningStatsService learningStatsService;

    public LearningStatsController(LearningStatsService learningStatsService) {
        this.learningStatsService = learningStatsService;
    }

    @GetMapping
    public LearningStatsDto get(Authentication authentication) {
        return learningStatsService.getFor(authentication);
    }
}

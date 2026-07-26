package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.AchievementDto;
import com.twojlogin.lms.dto.LearningAnalyticsDto;
import com.twojlogin.lms.service.AchievementService;
import com.twojlogin.lms.service.LearningAnalyticsService;
import com.twojlogin.lms.service.StudyActivityService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/learning")
public class LearningAnalyticsController {

    private final LearningAnalyticsService analyticsService;
    private final StudyActivityService activityService;
    private final AchievementService achievementService;

    public LearningAnalyticsController(
            LearningAnalyticsService analyticsService,
            StudyActivityService activityService,
            AchievementService achievementService
    ) {
        this.analyticsService = analyticsService;
        this.activityService = activityService;
        this.achievementService = achievementService;
    }

    @GetMapping("/analytics")
    public LearningAnalyticsDto analytics(Authentication authentication) {
        return analyticsService.get(authentication);
    }

    @GetMapping("/achievements")
    public List<AchievementDto> achievements(Authentication authentication) {
        return achievementService.getAndEvaluate(authentication);
    }

    @PostMapping("/heartbeat")
    public Map<String, Long> heartbeat(Authentication authentication) {
        return Map.of("todaySeconds", activityService.heartbeat(authentication));
    }
}

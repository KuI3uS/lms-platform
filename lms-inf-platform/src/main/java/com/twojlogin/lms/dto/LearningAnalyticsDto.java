package com.twojlogin.lms.dto;

import java.time.LocalDate;
import java.util.List;

public record LearningAnalyticsDto(
        long totalStudySeconds,
        long completedLessons,
        long completedModules,
        long attemptedTasks,
        long correctTasks,
        int taskAccuracy,
        long completedExams,
        int examAverage,
        List<HardTaskDto> hardestTasks,
        List<DailyActivityDto> recentActivity,
        List<AchievementDto> achievements,
        List<CertificateDto> certificates
) {
    public record HardTaskDto(
            Long blockId,
            String title,
            String lessonTitle,
            int attemptCount,
            boolean solved
    ) {
    }

    public record DailyActivityDto(
            LocalDate date,
            long seconds
    ) {
    }
}

package com.twojlogin.lms.dto;

public record LearningStatsDto(
        int xp,
        int streakDays,
        long completedLessons
) {
}

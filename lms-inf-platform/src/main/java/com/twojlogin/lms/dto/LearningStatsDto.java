package com.twojlogin.lms.dto;

import java.math.BigDecimal;

public record LearningStatsDto(
        long xp,
        int level,
        long levelStartXp,
        long nextLevelXp,
        long xpIntoLevel,
        long xpForNextLevel,
        int streakDays,
        int taskStreak,
        int bestTaskStreak,
        int xpMultiplier,
        long completedLessons,
        BigDecimal discountBalance,
        int nextRewardLevel,
        BigDecimal nextRewardAmount
) {
}

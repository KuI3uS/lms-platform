package com.twojlogin.lms.dto;

import java.math.BigDecimal;
import java.time.Instant;

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
        Instant taskStreakExpiresAt,
        long completedLessons,
        BigDecimal discountBalance,
        int nextRewardLevel,
        BigDecimal nextRewardAmount
) {
}

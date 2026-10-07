package com.twojlogin.lms.dto;

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
        long gemBalance,
        long totalGemsEarned,
        int nextGemRewardLevel,
        int nextGemRewardAmount,
        int voucher5Count,
        int voucher10Count,
        int voucher20Count,
        int xpBoostPercent,
        Instant xpBoostExpiresAt,
        String leagueName,
        String leagueColor,
        Integer nextLeagueLevel
) {
}

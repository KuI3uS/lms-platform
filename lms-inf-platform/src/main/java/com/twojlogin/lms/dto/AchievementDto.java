package com.twojlogin.lms.dto;

import com.twojlogin.lms.entity.AchievementType;

import java.time.LocalDateTime;

public record AchievementDto(
        AchievementType type,
        String title,
        String description,
        String icon,
        int gemReward,
        long progressCurrent,
        long progressTarget,
        boolean unlocked,
        LocalDateTime unlockedAt
) {
}

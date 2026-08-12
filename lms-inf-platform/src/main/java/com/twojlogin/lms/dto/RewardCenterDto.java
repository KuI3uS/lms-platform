package com.twojlogin.lms.dto;

import com.twojlogin.lms.entity.RewardItemType;

import java.time.Instant;
import java.util.List;

public record RewardCenterDto(
        long gemBalance,
        long totalGemsEarned,
        int gemsPerLesson,
        int level,
        LeagueDto league,
        Integer nextLeagueLevel,
        int nextGemRewardLevel,
        int nextGemRewardAmount,
        int xpBoostPercent,
        Instant xpBoostExpiresAt,
        VoucherWalletDto vouchers,
        AvatarDto avatar,
        List<RewardItemDto> catalog
) {
    public record LeagueDto(
            String name,
            String color,
            String symbol
    ) {
    }

    public record VoucherWalletDto(
            int discount5,
            int discount10,
            int discount20
    ) {
    }

    public record AvatarDto(
            String outfit,
            String accessory,
            String aura,
            int glowLevel
    ) {
    }

    public record RewardItemDto(
            String code,
            RewardItemType type,
            String title,
            String description,
            int cost,
            int requiredLevel,
            int discountPercent,
            int boostPercent,
            int boostHours,
            String visualStyle,
            boolean owned,
            boolean equipped,
            int quantity,
            boolean available
    ) {
    }
}

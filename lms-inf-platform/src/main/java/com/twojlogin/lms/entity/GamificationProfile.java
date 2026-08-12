package com.twojlogin.lms.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(
        name = "gamification_profiles",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_gamification_profile_user",
                columnNames = "user_id"
        )
)
public class GamificationProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private long totalXp;

    @Column(nullable = false)
    private int level = 1;

    @Column(nullable = false)
    private int correctTaskStreak;

    @Column(nullable = false)
    private int bestCorrectTaskStreak;

    private Instant correctTaskStreakUpdatedAt;

    @Column(nullable = false)
    private int rewardedMilestone;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal discountBalance = BigDecimal.ZERO;

    private Long gemBalance = 0L;

    private Long totalGemsEarned = 0L;

    private Integer rewardedGemLevel = 0;

    private Boolean gemEconomyInitialized = false;

    private Integer voucher5Count = 0;

    private Integer voucher10Count = 0;

    private Integer voucher20Count = 0;

    private Integer xpBoostPercent = 0;

    private Instant xpBoostExpiresAt;

    @Version
    private long version;

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public long getTotalXp() {
        return totalXp;
    }

    public void setTotalXp(long totalXp) {
        this.totalXp = totalXp;
    }

    public int getLevel() {
        return level;
    }

    public void setLevel(int level) {
        this.level = level;
    }

    public int getCorrectTaskStreak() {
        return correctTaskStreak;
    }

    public void setCorrectTaskStreak(int correctTaskStreak) {
        this.correctTaskStreak = correctTaskStreak;
    }

    public int getBestCorrectTaskStreak() {
        return bestCorrectTaskStreak;
    }

    public void setBestCorrectTaskStreak(int bestCorrectTaskStreak) {
        this.bestCorrectTaskStreak = bestCorrectTaskStreak;
    }

    public Instant getCorrectTaskStreakUpdatedAt() {
        return correctTaskStreakUpdatedAt;
    }

    public void setCorrectTaskStreakUpdatedAt(Instant correctTaskStreakUpdatedAt) {
        this.correctTaskStreakUpdatedAt = correctTaskStreakUpdatedAt;
    }

    public int getRewardedMilestone() {
        return rewardedMilestone;
    }

    public void setRewardedMilestone(int rewardedMilestone) {
        this.rewardedMilestone = rewardedMilestone;
    }

    public BigDecimal getDiscountBalance() {
        return discountBalance;
    }

    public void setDiscountBalance(BigDecimal discountBalance) {
        this.discountBalance = discountBalance;
    }

    public long getGemBalance() {
        return gemBalance == null ? 0 : gemBalance;
    }

    public void setGemBalance(long gemBalance) {
        this.gemBalance = Math.max(0, gemBalance);
    }

    public long getTotalGemsEarned() {
        return totalGemsEarned == null ? 0 : totalGemsEarned;
    }

    public void setTotalGemsEarned(long totalGemsEarned) {
        this.totalGemsEarned = Math.max(0, totalGemsEarned);
    }

    public int getRewardedGemLevel() {
        return rewardedGemLevel == null ? 0 : rewardedGemLevel;
    }

    public void setRewardedGemLevel(int rewardedGemLevel) {
        this.rewardedGemLevel = Math.max(0, rewardedGemLevel);
    }

    public boolean isGemEconomyInitialized() {
        return Boolean.TRUE.equals(gemEconomyInitialized);
    }

    public void setGemEconomyInitialized(boolean gemEconomyInitialized) {
        this.gemEconomyInitialized = gemEconomyInitialized;
    }

    public int getVoucher5Count() {
        return voucher5Count == null ? 0 : voucher5Count;
    }

    public void setVoucher5Count(int voucher5Count) {
        this.voucher5Count = Math.max(0, voucher5Count);
    }

    public int getVoucher10Count() {
        return voucher10Count == null ? 0 : voucher10Count;
    }

    public void setVoucher10Count(int voucher10Count) {
        this.voucher10Count = Math.max(0, voucher10Count);
    }

    public int getVoucher20Count() {
        return voucher20Count == null ? 0 : voucher20Count;
    }

    public void setVoucher20Count(int voucher20Count) {
        this.voucher20Count = Math.max(0, voucher20Count);
    }

    public int getXpBoostPercent() {
        return xpBoostPercent == null ? 0 : xpBoostPercent;
    }

    public void setXpBoostPercent(int xpBoostPercent) {
        this.xpBoostPercent = Math.max(0, xpBoostPercent);
    }

    public Instant getXpBoostExpiresAt() {
        return xpBoostExpiresAt;
    }

    public void setXpBoostExpiresAt(Instant xpBoostExpiresAt) {
        this.xpBoostExpiresAt = xpBoostExpiresAt;
    }

}

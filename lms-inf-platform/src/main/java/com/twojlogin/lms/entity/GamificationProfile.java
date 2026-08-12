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
}

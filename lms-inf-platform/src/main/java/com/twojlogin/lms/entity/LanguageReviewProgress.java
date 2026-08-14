package com.twojlogin.lms.entity;

import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(
        name = "language_review_progress",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_language_review_user_block",
                columnNames = {"user_id", "block_id"}
        ),
        indexes = @Index(
                name = "idx_language_review_due",
                columnList = "user_id,next_review_at"
        )
)
public class LanguageReviewProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "block_id", nullable = false)
    private LessonBlock block;

    @Column(name = "next_review_at", nullable = false)
    private Instant nextReviewAt;

    private int intervalDays;
    private int repetitions;
    private double easeFactor = 2.5;
    private int lastScore;
    private Instant updatedAt;

    public Long getId() { return id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public LessonBlock getBlock() { return block; }
    public void setBlock(LessonBlock block) { this.block = block; }
    public Instant getNextReviewAt() { return nextReviewAt; }
    public void setNextReviewAt(Instant nextReviewAt) { this.nextReviewAt = nextReviewAt; }
    public int getIntervalDays() { return intervalDays; }
    public void setIntervalDays(int intervalDays) { this.intervalDays = intervalDays; }
    public int getRepetitions() { return repetitions; }
    public void setRepetitions(int repetitions) { this.repetitions = repetitions; }
    public double getEaseFactor() { return easeFactor; }
    public void setEaseFactor(double easeFactor) { this.easeFactor = easeFactor; }
    public int getLastScore() { return lastScore; }
    public void setLastScore(int lastScore) { this.lastScore = lastScore; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}

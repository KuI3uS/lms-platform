package com.twojlogin.lms.service;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LearningStatsServiceTest {

    private final LocalDate today = LocalDate.of(2026, 7, 21);

    @Test
    void countsConsecutiveLearningDaysIncludingToday() {
        List<LocalDateTime> dates = List.of(
                today.atTime(10, 0),
                today.minusDays(1).atTime(18, 0),
                today.minusDays(2).atTime(8, 0),
                today.minusDays(4).atTime(12, 0)
        );

        assertEquals(3, LearningStatsService.calculateStreak(dates, today));
    }

    @Test
    void keepsYesterdayStreakUntilTheCurrentDayEnds() {
        List<LocalDateTime> dates = List.of(
                today.minusDays(1).atTime(18, 0),
                today.minusDays(2).atTime(8, 0)
        );

        assertEquals(2, LearningStatsService.calculateStreak(dates, today));
    }

    @Test
    void returnsZeroAfterMissingTwoConsecutiveDays() {
        List<LocalDateTime> dates = List.of(today.minusDays(2).atTime(18, 0));

        assertEquals(0, LearningStatsService.calculateStreak(dates, today));
    }
}

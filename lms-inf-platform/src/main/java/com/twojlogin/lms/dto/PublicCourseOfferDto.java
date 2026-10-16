package com.twojlogin.lms.dto;

import java.math.BigDecimal;
import java.util.List;

/** Public offer metadata only; never lesson content, solutions, payments or learner data. */
public record PublicCourseOfferDto(
        Long id,
        String title,
        String description,
        String billingMode,
        BigDecimal price,
        BigDecimal monthlyPrice,
        long stageCount,
        long plannedLessonCount,
        long availableLessonCount,
        List<OutlineItem> outline
) {
    public record OutlineItem(int stageNumber, String title) {}
}

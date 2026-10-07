package com.twojlogin.lms.dto;

import java.math.BigDecimal;

public record CourseSummaryDto(
        Long id,
        String name,
        String title,
        String description,
        BigDecimal price,
        boolean published,
        String thumbnailUrl,
        String level,
        long moduleCount,
        long lessonCount,
        long completedLessonCount,
        int progress,
        boolean paid,
        boolean canAccess,
        boolean enrolled,
        String accessStatus,
        String paymentUrl
) {
}

package com.twojlogin.lms.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.twojlogin.lms.entity.CourseBillingMode;

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
        String paymentUrl,
        CourseBillingMode billingMode,
        BigDecimal monthlyPrice,
        String monthlyPaymentUrl,
        LocalDateTime accessExpiresAt,
        String category,
        String courseLanguage,
        String cefrLevel
) {
}

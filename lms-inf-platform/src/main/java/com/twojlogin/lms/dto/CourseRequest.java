package com.twojlogin.lms.dto;

import java.math.BigDecimal;
import com.twojlogin.lms.entity.CourseBillingMode;

public record CourseRequest(
        String name,
        String title,
        String description,
        BigDecimal price,
        boolean published,
        String thumbnailUrl,
        String level,
        String paymentUrl,
        CourseBillingMode billingMode,
        BigDecimal monthlyPrice,
        String monthlyPaymentUrl,
        String category,
        String courseLanguage,
        String cefrLevel
) {
}

package com.twojlogin.lms.dto;

import java.math.BigDecimal;

public record CourseRequest(
        String name,
        String title,
        String description,
        BigDecimal price,
        boolean published,
        String thumbnailUrl,
        String level,
        String paymentUrl,
        String category,
        String courseLanguage,
        String cefrLevel
) {
}

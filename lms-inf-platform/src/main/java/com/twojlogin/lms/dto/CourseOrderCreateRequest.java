package com.twojlogin.lms.dto;

import java.math.BigDecimal;

public record CourseOrderCreateRequest(
        BigDecimal requestedDiscount
) {
}

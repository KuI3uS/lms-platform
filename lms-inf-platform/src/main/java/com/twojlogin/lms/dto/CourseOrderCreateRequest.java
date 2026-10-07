package com.twojlogin.lms.dto;

import java.math.BigDecimal;
import com.twojlogin.lms.entity.CoursePurchaseType;

public record CourseOrderCreateRequest(
        BigDecimal requestedDiscount,
        CoursePurchaseType purchaseType
) {
}

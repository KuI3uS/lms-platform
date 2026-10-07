package com.twojlogin.lms.dto;

import com.twojlogin.lms.entity.CoursePurchaseType;

public record CourseOrderCreateRequest(
        Integer discountPercent,
        CoursePurchaseType purchaseType
) {
}

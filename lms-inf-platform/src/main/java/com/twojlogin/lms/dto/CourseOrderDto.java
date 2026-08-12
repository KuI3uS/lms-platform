package com.twojlogin.lms.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.twojlogin.lms.entity.CourseOrder;
import com.twojlogin.lms.entity.CourseOrderStatus;
import com.twojlogin.lms.entity.CoursePurchaseType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record CourseOrderDto(
        Long id,
        String reference,
        Long courseId,
        String courseTitle,
        BigDecimal originalAmount,
        BigDecimal discountAmount,
        int discountPercent,
        BigDecimal amount,
        String currency,
        CourseOrderStatus status,
        CoursePurchaseType purchaseType,
        String paymentUrl,
        LocalDateTime createdAt,
        LocalDateTime paidAt,
        LocalDateTime accessUntil,
        Long userId,
        String userEmail
) {
    public static CourseOrderDto from(CourseOrder order, boolean includePaymentUrl) {
        return new CourseOrderDto(
                order.getId(),
                order.getReference(),
                order.getCourse().getId(),
                order.getCourse().getTitle() == null
                        ? order.getCourse().getName()
                        : order.getCourse().getTitle(),
                order.getOriginalAmount(),
                order.getDiscountAmount(),
                order.getDiscountPercent(),
                order.getAmount(),
                order.getCurrency(),
                order.getStatus(),
                order.getPurchaseType(),
                includePaymentUrl && order.getDiscountAmount().signum() == 0
                        ? order.getPurchaseType() == CoursePurchaseType.SUBSCRIPTION
                                ? order.getCourse().getMonthlyPaymentUrl()
                                : order.getCourse().getPaymentUrl()
                        : null,
                order.getCreatedAt(),
                order.getPaidAt(),
                order.getAccessUntil(),
                order.getUser().getId(),
                order.getUser().getEmail()
        );
    }
}

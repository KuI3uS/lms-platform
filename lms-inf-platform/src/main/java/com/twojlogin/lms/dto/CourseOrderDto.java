package com.twojlogin.lms.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.twojlogin.lms.entity.CourseOrder;
import com.twojlogin.lms.entity.CourseOrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record CourseOrderDto(
        Long id,
        String reference,
        Long courseId,
        String courseTitle,
        BigDecimal amount,
        String currency,
        CourseOrderStatus status,
        String paymentUrl,
        LocalDateTime createdAt,
        LocalDateTime paidAt,
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
                order.getAmount(),
                order.getCurrency(),
                order.getStatus(),
                includePaymentUrl ? order.getCourse().getPaymentUrl() : null,
                order.getCreatedAt(),
                order.getPaidAt(),
                order.getUser().getId(),
                order.getUser().getEmail()
        );
    }
}

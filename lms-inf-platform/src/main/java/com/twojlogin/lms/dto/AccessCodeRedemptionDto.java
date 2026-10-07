package com.twojlogin.lms.dto;

import java.time.LocalDateTime;

public record AccessCodeRedemptionDto(
        Long courseId,
        String courseTitle,
        LocalDateTime accessUntil,
        boolean unlimited
) { }

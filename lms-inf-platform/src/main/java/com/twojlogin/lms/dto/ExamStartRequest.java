package com.twojlogin.lms.dto;

public record ExamStartRequest(
        Long courseId,
        Integer questionCount,
        Integer durationMinutes
) {
}

package com.twojlogin.lms.dto;

public record ExamStartRequest(
        Long courseId,
        Integer questionCount,
        Integer durationMinutes,
        com.twojlogin.lms.entity.ExamType examType,
        String cefrLevel
) {
    public ExamStartRequest(Long courseId, Integer questionCount, Integer durationMinutes) {
        this(courseId, questionCount, durationMinutes, null, null);
    }
}

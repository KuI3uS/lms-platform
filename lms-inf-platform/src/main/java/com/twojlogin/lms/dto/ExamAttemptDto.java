package com.twojlogin.lms.dto;

import com.twojlogin.lms.entity.ExamAttemptStatus;

import java.time.LocalDateTime;
import java.util.List;

public record ExamAttemptDto(
        String id,
        Long courseId,
        String courseTitle,
        com.twojlogin.lms.entity.ExamType examType,
        String cefrLevel,
        ExamAttemptStatus status,
        int durationMinutes,
        int totalQuestions,
        int correctAnswers,
        double percentage,
        boolean passed,
        int tabSwitchCount,
        LocalDateTime startedAt,
        LocalDateTime expiresAt,
        LocalDateTime submittedAt,
        List<QuestionDto> questions
) {
}

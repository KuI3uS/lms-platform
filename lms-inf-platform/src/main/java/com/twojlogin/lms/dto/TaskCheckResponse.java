package com.twojlogin.lms.dto;

import java.util.List;

public record TaskCheckResponse(
        boolean correct,
        String message,
        int attemptCount,
        int hintLevel,
        String hint,
        List<TaskDiagnosticDto> diagnostics,
        String solutionPreview,
        boolean lessonCompleted,
        int xpEarned,
        int xpMultiplier,
        int taskStreak,
        int level,
        boolean levelUp
) {
}

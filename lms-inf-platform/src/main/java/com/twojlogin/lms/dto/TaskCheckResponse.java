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
    /** An infrastructure failure is not an assessed (incorrect) student answer. */
    public boolean isEvaluationUnavailable() {
        return diagnostics != null && diagnostics.stream().anyMatch(diagnostic ->
                diagnostic.type().startsWith("RUNNER_"));
    }
}

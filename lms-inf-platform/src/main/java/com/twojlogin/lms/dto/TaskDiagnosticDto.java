package com.twojlogin.lms.dto;

public record TaskDiagnosticDto(
        String type,
        Integer line,
        String message,
        String suggestion
) {
}

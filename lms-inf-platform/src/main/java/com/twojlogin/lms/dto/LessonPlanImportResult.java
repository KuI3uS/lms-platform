package com.twojlogin.lms.dto;

public record LessonPlanImportResult(
        int stagesUpdated,
        int lessonsCreated,
        int duplicatesSkipped
) {
}

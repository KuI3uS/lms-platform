package com.twojlogin.lms.dto;

public record StageLessonBlockImportResult(
        int lessonsFilled, int lessonsSkipped, int lessonsPublished, int blocksCreated
) {}

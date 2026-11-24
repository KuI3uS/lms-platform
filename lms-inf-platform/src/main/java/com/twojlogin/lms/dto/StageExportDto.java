package com.twojlogin.lms.dto;

import java.util.List;

/** Explicit authoring data only: no accounts, student answers or progress. */
public record StageExportDto(
        int version,
        Long moduleId,
        int stageNumber,
        String stageTitle,
        String sectionTitle,
        String cefrLevel,
        boolean lessonsLocked,
        Long courseId,
        String courseTitle,
        String contentLanguage,
        String category,
        List<ExportLesson> lessons
) {
    public record ExportLesson(
            String title,
            Integer orderIndex,
            boolean published,
            boolean freePreview,
            String theory,
            String example,
            String content,
            String imageUrl,
            List<LessonBlockRequest> blocks
    ) {}
}

package com.twojlogin.lms.dto;

import java.util.List;

/** Targets existing lesson IDs only. This operation never creates lesson cards. */
public record StageLessonBlockImportRequest(List<LessonBlocks> lessons, Boolean publishLessons) {
    public record LessonBlocks(Long lessonId, String title, List<LessonBlockRequest> blocks) {}
}

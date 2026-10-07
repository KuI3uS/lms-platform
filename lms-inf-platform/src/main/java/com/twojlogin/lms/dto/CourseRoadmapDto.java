package com.twojlogin.lms.dto;

import java.util.List;

public record CourseRoadmapDto(
        Long id,
        String name,
        String title,
        String category,
        String courseLanguage,
        String cefrLevel,
        List<ModuleItem> modules
) {
    public record ModuleItem(
            Long id,
            String name,
            boolean lessonsLocked,
            List<LessonItem> lessons
    ) {
    }

    public record LessonItem(
            Long id,
            String title,
            Integer orderIndex,
            boolean completed,
            boolean canAccess
    ) {
    }
}

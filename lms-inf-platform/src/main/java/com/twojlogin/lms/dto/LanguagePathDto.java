package com.twojlogin.lms.dto;

import java.util.List;

public record LanguagePathDto(
        Long courseId,
        String courseTitle,
        String language,
        String startLevel,
        String endLevel,
        String unlockedLevel,
        boolean completed,
        List<LevelItem> levels
) {
    public record LevelItem(
            String level,
            boolean unlocked,
            long lessonCount,
            long completedLessonCount,
            boolean courseworkCompleted,
            boolean finalExamPassed,
            boolean placementExamPassed,
            boolean skippedByPlacement,
            long questionCount,
            boolean finalExamAvailable,
            boolean placementExamAvailable
    ) {
    }
}

package com.twojlogin.lms.dto;

import com.twojlogin.lms.entity.BlockType;

public record LessonBlockRequest(
        String title,
        BlockType type,
        String content,
        String description,
        String instruction,
        String starterCode,
        String expectedAnswer,
        String hint,
        String detailedHint,
        String solutionExplanation,
        String language,
        String hiddenTests,
        String mediaUrl,
        String mediaType,
        Boolean published,
        Integer points,
        Integer orderIndex
) {
}

package com.twojlogin.lms.dto;

import com.twojlogin.lms.entity.BlockType;
import com.twojlogin.lms.entity.LessonBlock;

public record LessonBlockDto(
        Long id,
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
        String mediaUrl,
        String mediaType,
        Boolean published,
        Integer points,
        Integer orderIndex,
        Long lessonId
) {
    public static LessonBlockDto from(LessonBlock block, boolean includeSolutions) {
        return new LessonBlockDto(
                block.getId(),
                block.getTitle(),
                block.getType() == null ? null : block.getType().normalized(),
                block.getContent(),
                block.getDescription(),
                block.getInstruction(),
                block.getStarterCode(),
                includeSolutions ? block.getExpectedAnswer() : null,
                includeSolutions ? block.getHint() : null,
                includeSolutions ? block.getDetailedHint() : null,
                includeSolutions ? block.getSolutionExplanation() : null,
                block.getLanguage(),
                block.getMediaUrl(),
                block.getMediaType(),
                block.getPublished(),
                block.getPoints(),
                block.getOrderIndex(),
                block.getLesson() == null ? null : block.getLesson().getId()
        );
    }
}

package com.twojlogin.lms.dto;

import com.twojlogin.lms.entity.LanguageReviewProgress;
import com.twojlogin.lms.entity.BlockType;

import java.time.Instant;

public record LanguageReviewDto(
        Long blockId,
        Long lessonId,
        BlockType blockType,
        String lessonTitle,
        String title,
        String phrase,
        String audioUrl,
        String language,
        Instant dueAt,
        int lastScore,
        int repetitions
) {
    public static LanguageReviewDto from(LanguageReviewProgress review) {
        var block = review.getBlock();
        return new LanguageReviewDto(
                block.getId(),
                block.getLesson().getId(),
                block.getType(),
                block.getLesson().getTitle(),
                block.getTitle(),
                block.getType() == BlockType.AUDIO
                        ? block.getContent()
                        : block.getInstruction() == null || block.getInstruction().isBlank()
                            ? block.getTitle()
                            : block.getInstruction(),
                block.getMediaUrl(),
                block.getLanguage(),
                review.getNextReviewAt(),
                review.getLastScore(),
                review.getRepetitions()
        );
    }
}

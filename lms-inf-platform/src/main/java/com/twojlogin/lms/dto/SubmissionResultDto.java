package com.twojlogin.lms.dto;

import com.twojlogin.lms.entity.CourseModule;
import com.twojlogin.lms.entity.Submission;

import java.time.LocalDateTime;

public record SubmissionResultDto(
        Long id,
        int correctAnswers,
        int totalQuestions,
        double percentage,
        int tabSwitchCount,
        boolean disqualified,
        LocalDateTime submittedAt,
        ModuleDto module
) {
    public static SubmissionResultDto from(Submission submission) {
        return new SubmissionResultDto(
                submission.getId(),
                submission.getCorrectAnswers(),
                submission.getTotalQuestions(),
                submission.getPercentage(),
                submission.getTabSwitchCount(),
                submission.isDisqualified(),
                submission.getSubmittedAt(),
                ModuleDto.from(submission.getModule())
        );
    }

    public record ModuleDto(Long id, String name) {
        public static ModuleDto from(CourseModule module) {
            return module == null ? null : new ModuleDto(module.getId(), module.getName());
        }
    }
}

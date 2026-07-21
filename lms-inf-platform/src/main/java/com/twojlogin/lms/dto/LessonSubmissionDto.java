package com.twojlogin.lms.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.entity.LessonSubmission;
import com.twojlogin.lms.entity.LessonSubmissionAnswer;
import com.twojlogin.lms.entity.User;

import java.time.LocalDateTime;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record LessonSubmissionDto(
        Long id,
        LocalDateTime submittedAt,
        String status,
        String grade,
        String teacherComment,
        SubmissionUserDto user,
        SubmissionLessonDto lesson,
        List<SubmissionAnswerDto> answers
) {
    public static LessonSubmissionDto forStudent(LessonSubmission submission) {
        return from(submission, false);
    }

    public static LessonSubmissionDto forAdmin(LessonSubmission submission) {
        return from(submission, true);
    }

    private static LessonSubmissionDto from(LessonSubmission submission, boolean admin) {
        List<SubmissionAnswerDto> answers = submission.getAnswers() == null
                ? List.of()
                : submission.getAnswers().stream()
                .map(answer -> SubmissionAnswerDto.from(answer, admin))
                .toList();

        return new LessonSubmissionDto(
                submission.getId(),
                submission.getSubmittedAt(),
                submission.getStatus(),
                submission.getGrade(),
                submission.getTeacherComment(),
                admin ? SubmissionUserDto.from(submission.getUser()) : null,
                SubmissionLessonDto.from(submission.getLesson()),
                answers
        );
    }

    public record SubmissionUserDto(
            Long id,
            String email,
            String firstName,
            String lastName,
            String schoolClass
    ) {
        public static SubmissionUserDto from(User user) {
            if (user == null) return null;
            return new SubmissionUserDto(
                    user.getId(),
                    user.getEmail(),
                    user.getFirstName(),
                    user.getLastName(),
                    user.getSchoolClass() == null ? null : user.getSchoolClass().getName()
            );
        }
    }

    public record SubmissionLessonDto(Long id, String title) {
        public static SubmissionLessonDto from(Lesson lesson) {
            return lesson == null ? null : new SubmissionLessonDto(lesson.getId(), lesson.getTitle());
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record SubmissionAnswerDto(
            Long id,
            Long blockId,
            String taskContent,
            String studentAnswer,
            String expectedAnswer,
            Boolean correct
    ) {
        public static SubmissionAnswerDto from(LessonSubmissionAnswer answer, boolean admin) {
            return new SubmissionAnswerDto(
                    answer.getId(),
                    answer.getBlockId(),
                    answer.getTaskContent(),
                    answer.getInstruction(),
                    admin ? answer.getExpectedAnswer() : null,
                    answer.getCorrect()
            );
        }
    }
}

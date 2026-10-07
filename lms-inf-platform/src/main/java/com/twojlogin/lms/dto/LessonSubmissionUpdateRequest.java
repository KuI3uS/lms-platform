package com.twojlogin.lms.dto;

public record LessonSubmissionUpdateRequest(
        String status,
        String grade,
        String teacherComment
) {
}

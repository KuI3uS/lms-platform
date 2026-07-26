package com.twojlogin.lms.dto;

public record ExamAnswerRequest(
        Long questionId,
        Long answerId
) {
}

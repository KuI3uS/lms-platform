package com.twojlogin.lms.dto;

import java.util.List;

public record ExamSubmitRequest(
        List<ExamAnswerRequest> answers,
        int tabSwitchCount
) {
}

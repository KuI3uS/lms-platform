package com.twojlogin.lms.dto;

import java.util.List;

public class CreateQuestionRequest {
    public String content;
    public List<CreateAnswerRequest> answers;
}
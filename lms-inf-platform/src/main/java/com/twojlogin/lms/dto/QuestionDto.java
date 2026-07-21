package com.twojlogin.lms.dto;

import com.twojlogin.lms.entity.Answer;
import com.twojlogin.lms.entity.Question;

import java.util.List;

public record QuestionDto(
        Long id,
        String content,
        List<AnswerOptionDto> answers
) {
    public static QuestionDto from(Question question) {
        List<AnswerOptionDto> answerOptions = question.getAnswers() == null
                ? List.of()
                : question.getAnswers().stream().map(AnswerOptionDto::from).toList();

        return new QuestionDto(question.getId(), question.getContent(), answerOptions);
    }

    public record AnswerOptionDto(Long id, String content) {
        public static AnswerOptionDto from(Answer answer) {
            return new AnswerOptionDto(answer.getId(), answer.getContent());
        }
    }
}

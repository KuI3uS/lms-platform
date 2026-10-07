package com.twojlogin.lms.dto;

import java.util.List;

public class LessonSubmitRequest {

    private Long lessonId;
    private String studentEmail;
    private String lessonTitle;
    private List<TaskAnswerDto> answers;

    public Long getLessonId() {
        return lessonId;
    }

    public void setLessonId(Long lessonId) {
        this.lessonId = lessonId;
    }

    public String getStudentEmail() {
        return studentEmail;
    }

    public void setStudentEmail(String studentEmail) {
        this.studentEmail = studentEmail;
    }

    public String getLessonTitle() {
        return lessonTitle;
    }

    public void setLessonTitle(String lessonTitle) {
        this.lessonTitle = lessonTitle;
    }

    public List<TaskAnswerDto> getAnswers() {
        return answers;
    }

    public void setAnswers(List<TaskAnswerDto> answers) {
        this.answers = answers;
    }
}
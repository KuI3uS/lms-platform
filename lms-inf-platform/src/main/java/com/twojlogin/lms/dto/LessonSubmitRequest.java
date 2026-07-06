package com.twojlogin.lms.dto;

import com.twojlogin.lms.entity.LessonSubmissionAnswer;

import java.util.List;

public class LessonSubmitRequest {

    private Long lessonId;
    private String studentEmail;
    private String lessonTitle;
    private List<LessonSubmissionAnswer> answers;

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

    public List<LessonSubmissionAnswer> getAnswers() {
        return answers;
    }

    public void setAnswers(List<LessonSubmissionAnswer> answers) {
        this.answers = answers;
    }
}
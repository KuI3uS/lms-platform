package com.twojlogin.lms.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
public class LessonSubmissionAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long taskId;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String taskContent;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String studentAnswer;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String expectedAnswer;

    private Boolean correct;

    @ManyToOne
    @JoinColumn(name = "submission_id")
    @JsonIgnore
    private LessonSubmission submission;

    public Long getId() {
        return id;
    }

    public Long getTaskId() {
        return taskId;
    }

    public void setTaskId(Long taskId) {
        this.taskId = taskId;
    }

    public String getTaskContent() {
        return taskContent;
    }

    public void setTaskContent(String taskContent) {
        this.taskContent = taskContent;
    }

    public String getStudentAnswer() {
        return studentAnswer;
    }

    public void setStudentAnswer(String studentAnswer) {
        this.studentAnswer = studentAnswer;
    }

    public String getExpectedAnswer() {
        return expectedAnswer;
    }

    public void setExpectedAnswer(String expectedAnswer) {
        this.expectedAnswer = expectedAnswer;
    }

    public Boolean getCorrect() {
        return correct;
    }

    public void setCorrect(Boolean correct) {
        this.correct = correct;
    }

    public LessonSubmission getSubmission() {
        return submission;
    }

    public void setSubmission(LessonSubmission submission) {
        this.submission = submission;
    }
}
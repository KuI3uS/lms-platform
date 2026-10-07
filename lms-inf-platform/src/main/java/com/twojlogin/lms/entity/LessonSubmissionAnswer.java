package com.twojlogin.lms.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
public class LessonSubmissionAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long blockId;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String taskContent;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String instruction;

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

    public String getTaskContent() {
        return taskContent;
    }

    public void setTaskContent(String taskContent) {
        this.taskContent = taskContent;
    }


    public void setId(Long id) {
        this.id = id;
    }

    public Long getBlockId() {
        return blockId;
    }

    public void setBlockId(Long blockId) {
        this.blockId = blockId;
    }

    public String getInstruction() {
        return instruction;
    }

    public void setInstruction(String instruction) {
        this.instruction = instruction;
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
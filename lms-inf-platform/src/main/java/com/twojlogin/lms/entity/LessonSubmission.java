package com.twojlogin.lms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
public class LessonSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime submittedAt;

    private String status; // NEW, CHECKED, TO_FIX

    private String grade;

    @Column(length = 5000)
    private String teacherComment;

    @ManyToOne
    private User user;

    @ManyToOne
    private Lesson lesson;

    @OneToMany(mappedBy = "submission", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LessonSubmissionAnswer> answers;

    public Long getId() { return id; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getGrade() { return grade; }
    public void setGrade(String grade) { this.grade = grade; }

    public String getTeacherComment() { return teacherComment; }
    public void setTeacherComment(String teacherComment) { this.teacherComment = teacherComment; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Lesson getLesson() { return lesson; }
    public void setLesson(Lesson lesson) { this.lesson = lesson; }

    public List<LessonSubmissionAnswer> getAnswers() { return answers; }
    public void setAnswers(List<LessonSubmissionAnswer> answers) { this.answers = answers; }
}
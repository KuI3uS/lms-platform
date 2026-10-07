package com.twojlogin.lms.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
public class LessonBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /*
     * Podstawowe informacje
     */

    private String title;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "VARCHAR(32)")
    private BlockType type;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String content;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String description;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String instruction;

    /*
     * Kod
     */

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String starterCode;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String expectedAnswer;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String hint;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String detailedHint;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String solutionExplanation;

    private String language;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String hiddenTests;

    /*
     * Multimedia
     */

    @Lob
    @Column(columnDefinition = "TEXT")
    private String mediaUrl;

    private String mediaType;

    /*
     * Ustawienia
     */

    private Boolean published = true;

    private Integer points = 0;

    private Integer orderIndex = 0;

    /*
     * Relacje
     */

    @ManyToOne
    @JoinColumn(name = "lesson_id")
    @JsonIgnoreProperties({"course","lessons"})
    private Lesson lesson;

    /*
     * Gettery / Settery
     */

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Lesson getLesson() {
        return lesson;
    }

    public void setLesson(Lesson lesson) {
        this.lesson = lesson;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public BlockType getType() {
        return type;
    }

    public void setType(BlockType type) {
        this.type = type;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getInstruction() {
        return instruction;
    }

    public void setInstruction(String instruction) {
        this.instruction = instruction;
    }

    public String getStarterCode() {
        return starterCode;
    }

    public void setStarterCode(String starterCode) {
        this.starterCode = starterCode;
    }

    public String getExpectedAnswer() {
        return expectedAnswer;
    }

    public void setExpectedAnswer(String expectedAnswer) {
        this.expectedAnswer = expectedAnswer;
    }

    public String getHint() {
        return hint;
    }

    public void setHint(String hint) {
        this.hint = hint;
    }

    public String getDetailedHint() {
        return detailedHint;
    }

    public void setDetailedHint(String detailedHint) {
        this.detailedHint = detailedHint;
    }

    public String getSolutionExplanation() {
        return solutionExplanation;
    }

    public void setSolutionExplanation(String solutionExplanation) {
        this.solutionExplanation = solutionExplanation;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getHiddenTests() {
        return hiddenTests;
    }

    public void setHiddenTests(String hiddenTests) {
        this.hiddenTests = hiddenTests;
    }

    public String getMediaUrl() {
        return mediaUrl;
    }

    public void setMediaUrl(String mediaUrl) {
        this.mediaUrl = mediaUrl;
    }

    public String getMediaType() {
        return mediaType;
    }

    public void setMediaType(String mediaType) {
        this.mediaType = mediaType;
    }

    public Boolean getPublished() {
        return published;
    }

    public void setPublished(Boolean published) {
        this.published = published;
    }

    public Integer getPoints() {
        return points;
    }

    public void setPoints(Integer points) {
        this.points = points;
    }

    public Integer getOrderIndex() {
        return orderIndex;
    }

    public void setOrderIndex(Integer orderIndex) {
        this.orderIndex = orderIndex;
    }
}

package com.twojlogin.lms.dto;

public class LessonDto {
    public Long id;
    public String title;
    public String theory;
    public String example;
    public String content;
    public String imageUrl;
    public boolean published;
    public boolean freePreview;
    public Integer orderIndex;
    public Long moduleId;
    public boolean completed;
    public boolean canAccess;

    public LessonDto(com.twojlogin.lms.entity.Lesson lesson) {
        this.id = lesson.getId();
        this.title = lesson.getTitle();
        this.theory = lesson.getTheory();
        this.example = lesson.getExample();
        this.content = lesson.getContent();
        this.imageUrl = lesson.getImageUrl();
        this.published = lesson.isPublished();
        this.freePreview = lesson.isFreePreview();
        this.orderIndex = lesson.getOrderIndex();
        this.moduleId = lesson.getModule() != null ? lesson.getModule().getId() : null;
    }

    public LessonDto(com.twojlogin.lms.entity.Lesson lesson, boolean completed) {
        this(lesson);
        this.completed = completed;
    }

    public LessonDto(
            com.twojlogin.lms.entity.Lesson lesson,
            boolean completed,
            boolean canAccess
    ) {
        this(lesson, completed);
        this.canAccess = canAccess;
    }
}

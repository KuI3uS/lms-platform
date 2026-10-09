package com.twojlogin.lms.dto;

import java.util.List;

public record LessonPlanImportRequest(List<StageLessons> stages) {

    public record StageLessons(Integer stageNumber, List<String> lessonTitles) {
    }
}

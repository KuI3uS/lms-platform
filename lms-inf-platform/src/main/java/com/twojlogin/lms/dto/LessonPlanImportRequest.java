package com.twojlogin.lms.dto;

import java.util.List;

public record LessonPlanImportRequest(List<StageLessons> stages) {

    public record StageLessons(Integer stageNumber, String stageTitle, List<String> lessonTitles) {
        public StageLessons(Integer stageNumber, List<String> lessonTitles) {
            this(stageNumber, null, lessonTitles);
        }
    }
}

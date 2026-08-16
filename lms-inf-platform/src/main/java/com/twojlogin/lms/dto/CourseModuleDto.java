package com.twojlogin.lms.dto;

import com.twojlogin.lms.entity.CourseModule;

public record CourseModuleDto(
        Long id,
        String name,
        boolean lessonsLocked,
        Long courseId,
        String cefrLevel
) {
    public static CourseModuleDto from(CourseModule module) {
        return new CourseModuleDto(
                module.getId(),
                module.getName(),
                module.isLessonsLocked(),
                module.getCourse() == null ? null : module.getCourse().getId(),
                module.getCefrLevel()
        );
    }
}

package com.twojlogin.lms.dto;

import java.util.List;

public record CurriculumImportReport(
        String mode,
        String curriculum,
        String version,
        Long courseId,
        int matchedModules,
        int readyModules,
        int skippedNonEmptyModules,
        int lessons,
        int blocks,
        List<String> warnings
) {
}

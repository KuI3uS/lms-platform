package com.twojlogin.lms.dto;

import java.util.List;

public record CourseDuplicatePreview(
        String version,
        int modulesToDelete,
        int lessonsToDelete,
        int protectedCopies,
        List<Group> groups
) {
    public record Group(
            String kind, String title, int stageNumber, Long keptId,
            List<Long> duplicateIds, int protectedCopies
    ) {}
}

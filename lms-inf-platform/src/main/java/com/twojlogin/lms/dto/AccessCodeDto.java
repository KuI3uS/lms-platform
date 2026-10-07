package com.twojlogin.lms.dto;

import com.twojlogin.lms.entity.AccessCodeType;
import com.twojlogin.lms.entity.CourseAccessCode;

import java.time.LocalDateTime;

public record AccessCodeDto(
        Long id,
        String code,
        String codePreview,
        Long courseId,
        String courseTitle,
        AccessCodeType accessType,
        LocalDateTime createdAt,
        LocalDateTime expiresAt,
        LocalDateTime redeemedAt,
        LocalDateTime revokedAt,
        String redeemedByEmail,
        String status
) {
    public static AccessCodeDto from(CourseAccessCode value, String fullCode, LocalDateTime now) {
        String status = value.getRevokedAt() != null ? "REVOKED"
                : value.getRedeemedAt() != null ? "REDEEMED"
                : !value.getExpiresAt().isAfter(now) ? "EXPIRED"
                : "ACTIVE";
        String title = value.getCourse().getTitle() == null
                ? value.getCourse().getName()
                : value.getCourse().getTitle();
        return new AccessCodeDto(
                value.getId(), fullCode, value.getCodePreview(), value.getCourse().getId(), title,
                value.getAccessType(), value.getCreatedAt(), value.getExpiresAt(),
                value.getRedeemedAt(), value.getRevokedAt(),
                value.getRedeemedBy() == null ? null : value.getRedeemedBy().getEmail(), status
        );
    }
}

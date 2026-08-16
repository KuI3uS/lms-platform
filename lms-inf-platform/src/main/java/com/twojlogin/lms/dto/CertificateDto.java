package com.twojlogin.lms.dto;

import com.twojlogin.lms.entity.CourseCertificate;

import java.time.LocalDateTime;

public record CertificateDto(
        String certificateNumber,
        Long courseId,
        String courseTitle,
        String studentName,
        LocalDateTime issuedAt,
        String category,
        String courseLanguage,
        String cefrLevel
) {
    public static CertificateDto from(CourseCertificate certificate) {
        String fullName = ((certificate.getUser().getFirstName() == null
                ? ""
                : certificate.getUser().getFirstName()) + " "
                + (certificate.getUser().getLastName() == null
                ? ""
                : certificate.getUser().getLastName())).trim();

        return new CertificateDto(
                certificate.getCertificateNumber(),
                certificate.getCourse().getId(),
                certificate.getCourse().getTitle() == null
                        ? certificate.getCourse().getName()
                        : certificate.getCourse().getTitle(),
                fullName.isBlank() ? certificate.getUser().getEmail() : fullName,
                certificate.getIssuedAt(),
                certificate.getCourse().getCategory(),
                certificate.getCourse().getCourseLanguage(),
                certificate.getCourse().getCefrEndLevel()
        );
    }
}

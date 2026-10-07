package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.CertificateDto;
import com.twojlogin.lms.entity.Course;
import com.twojlogin.lms.entity.CourseCertificate;
import com.twojlogin.lms.entity.NotificationType;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.CourseCertificateRepository;
import com.twojlogin.lms.repository.LessonProgressRepository;
import com.twojlogin.lms.repository.LessonRepository;
import com.twojlogin.lms.repository.CourseRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CertificateService {

    private final CourseCertificateRepository certificateRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final CourseAccessService accessService;
    private final NotificationService notificationService;
    private final CourseRepository courseRepository;

    public CertificateService(
            CourseCertificateRepository certificateRepository,
            LessonRepository lessonRepository,
            LessonProgressRepository lessonProgressRepository,
            CourseAccessService accessService,
            NotificationService notificationService,
            CourseRepository courseRepository
    ) {
        this.certificateRepository = certificateRepository;
        this.lessonRepository = lessonRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.accessService = accessService;
        this.notificationService = notificationService;
        this.courseRepository = courseRepository;
    }

    @Transactional
    public Optional<CourseCertificate> issueIfEligible(User user, Course course) {
        Optional<CourseCertificate> existing =
                certificateRepository.findByUserIdAndCourseId(user.getId(), course.getId());
        if (existing.isPresent()) return existing;

        long lessonCount = lessonRepository.countByModuleCourseId(course.getId());
        long completed = lessonProgressRepository
                .countCompletedByUserIdAndCourseId(user.getId(), course.getId());
        if (lessonCount == 0 || completed < lessonCount) return Optional.empty();

        CourseCertificate certificate = new CourseCertificate();
        certificate.setCertificateNumber(
                "EDU-" + Year.now().getValue() + "-"
                        + UUID.randomUUID().toString().substring(0, 8).toUpperCase()
        );
        certificate.setUser(user);
        certificate.setCourse(course);
        certificate.setIssuedAt(LocalDateTime.now());
        CourseCertificate saved = certificateRepository.save(certificate);

        notificationService.create(
                user,
                NotificationType.CERTIFICATE,
                "Certyfikat jest gotowy",
                "Ukończyłeś kurs „" + courseTitle(course) + "”. Pobierz swój certyfikat.",
                "/learning-center"
        );
        return Optional.of(saved);
    }

    @Transactional
    public void issueEligibleForUser(User user) {
        courseRepository.findAll().forEach(course -> issueIfEligible(user, course));
    }

    @Transactional(readOnly = true)
    public List<CertificateDto> mine(Authentication authentication) {
        User user = accessService.currentUser(authentication);
        return certificateRepository.findByUserIdOrderByIssuedAtDesc(user.getId()).stream()
                .map(CertificateDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public CertificateDto verify(String certificateNumber) {
        return certificateRepository.findByCertificateNumber(certificateNumber)
                .map(CertificateDto::from)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Certyfikat nie istnieje"
                ));
    }

    private String courseTitle(Course course) {
        return course.getTitle() == null ? course.getName() : course.getTitle();
    }
}

package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.AccessCodeCreateRequest;
import com.twojlogin.lms.dto.AccessCodeDto;
import com.twojlogin.lms.dto.AccessCodeRedemptionDto;
import com.twojlogin.lms.entity.*;
import com.twojlogin.lms.repository.CourseAccessCodeRepository;
import com.twojlogin.lms.repository.CourseEnrollmentRepository;
import com.twojlogin.lms.repository.CourseRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HexFormat;
import java.util.List;

@Service
public class CourseAccessCodeService {
    private static final ZoneId WARSAW_ZONE = ZoneId.of("Europe/Warsaw");
    private static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final CourseAccessCodeRepository codeRepository;
    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final CourseAccessService accessService;
    private final NotificationService notificationService;

    public CourseAccessCodeService(
            CourseAccessCodeRepository codeRepository,
            CourseRepository courseRepository,
            CourseEnrollmentRepository enrollmentRepository,
            CourseAccessService accessService,
            NotificationService notificationService
    ) {
        this.codeRepository = codeRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.accessService = accessService;
        this.notificationService = notificationService;
    }

    @Transactional
    public AccessCodeDto create(AccessCodeCreateRequest request) {
        if (request == null || request.courseId() == null || request.accessType() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Wybierz kurs i rodzaj dostępu");
        }
        Course course = courseRepository.findById(request.courseId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kurs nie istnieje"));
        String code = uniqueCode();
        LocalDateTime now = now();
        CourseAccessCode entity = new CourseAccessCode();
        entity.setCodeHash(hash(normalize(code)));
        entity.setCodePreview(code.substring(0, 4) + "-…-" + code.substring(code.length() - 4));
        entity.setCourse(course);
        entity.setAccessType(request.accessType());
        entity.setCreatedAt(now);
        entity.setExpiresAt(now.plusDays(14));
        return AccessCodeDto.from(codeRepository.save(entity), code, now);
    }

    @Transactional(readOnly = true)
    public List<AccessCodeDto> all() {
        LocalDateTime now = now();
        return codeRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(value -> AccessCodeDto.from(value, null, now))
                .toList();
    }

    @Transactional
    public AccessCodeDto revoke(Long id) {
        CourseAccessCode code = codeRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kod nie istnieje"));
        if (code.getRedeemedAt() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Wykorzystanego kodu nie można unieważnić");
        }
        if (code.getRevokedAt() == null) code.setRevokedAt(now());
        return AccessCodeDto.from(codeRepository.save(code), null, now());
    }

    @Transactional
    public AccessCodeRedemptionDto redeem(String rawCode, Authentication authentication) {
        User user = accessService.currentUser(authentication);
        if (accessService.isAdmin(user)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Administrator ma już dostęp do wszystkich kursów");
        }
        String normalized = normalize(rawCode);
        if (normalized.length() != 12) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nieprawidłowy kod dostępu");
        }
        CourseAccessCode code = codeRepository.findByCodeHash(hash(normalized))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kod jest nieprawidłowy"));
        LocalDateTime now = now();
        if (code.getRevokedAt() != null) {
            throw new ResponseStatusException(HttpStatus.GONE, "Ten kod został unieważniony");
        }
        if (code.getRedeemedAt() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ten kod został już wykorzystany");
        }
        if (!code.getExpiresAt().isAfter(now)) {
            throw new ResponseStatusException(HttpStatus.GONE, "Ten kod wygasł po 14 dniach");
        }

        CourseEnrollment enrollment = enrollmentRepository
                .findByUserIdAndCourseId(user.getId(), code.getCourse().getId())
                .orElseGet(CourseEnrollment::new);
        if (enrollment.isActive() && enrollment.getAccessExpiresAt() == null && enrollment.getId() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Masz już bezterminowy dostęp do tego kursu");
        }
        enrollment.setUser(user);
        enrollment.setCourse(code.getCourse());
        enrollment.setSource(EnrollmentSource.ACCESS_CODE);
        enrollment.setActive(true);
        enrollment.setEnrolledAt(now);
        if (code.getAccessType() == AccessCodeType.UNLIMITED) {
            enrollment.setAccessExpiresAt(null);
        } else {
            LocalDateTime current = enrollment.getAccessExpiresAt();
            enrollment.setAccessExpiresAt(current != null && current.isAfter(now)
                    ? current.plusDays(30)
                    : now.plusDays(30));
        }
        enrollment = enrollmentRepository.save(enrollment);
        code.setRedeemedAt(now);
        code.setRedeemedBy(user);
        codeRepository.save(code);

        String title = courseTitle(code.getCourse());
        notificationService.create(
                user, NotificationType.COURSE_ACCESS, "Kod został wykorzystany",
                "Odblokowaliśmy kurs „" + title + "”.", "/modules/" + code.getCourse().getId()
        );
        return new AccessCodeRedemptionDto(
                code.getCourse().getId(), title, enrollment.getAccessExpiresAt(),
                enrollment.getAccessExpiresAt() == null
        );
    }

    private String uniqueCode() {
        for (int attempt = 0; attempt < 10; attempt++) {
            StringBuilder raw = new StringBuilder(12);
            for (int i = 0; i < 12; i++) raw.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
            String normalized = raw.toString();
            if (!codeRepository.existsByCodeHash(hash(normalized))) {
                return normalized.substring(0, 4) + "-" + normalized.substring(4, 8) + "-" + normalized.substring(8);
            }
        }
        throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Nie udało się wygenerować kodu");
    }

    private String normalize(String code) {
        return code == null ? "" : code.toUpperCase().replaceAll("[^A-Z0-9]", "");
    }

    private String hash(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private String courseTitle(Course course) {
        return course.getTitle() == null ? course.getName() : course.getTitle();
    }

    private LocalDateTime now() { return LocalDateTime.now(WARSAW_ZONE); }
}

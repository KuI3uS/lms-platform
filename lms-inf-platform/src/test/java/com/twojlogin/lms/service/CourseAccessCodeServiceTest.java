package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.AccessCodeCreateRequest;
import com.twojlogin.lms.dto.AccessCodeDto;
import com.twojlogin.lms.dto.AccessCodeRedemptionDto;
import com.twojlogin.lms.entity.*;
import com.twojlogin.lms.repository.CourseAccessCodeRepository;
import com.twojlogin.lms.repository.CourseEnrollmentRepository;
import com.twojlogin.lms.repository.CourseRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class CourseAccessCodeServiceTest {
    private CourseAccessCodeRepository codeRepository;
    private CourseEnrollmentRepository enrollmentRepository;
    private CourseAccessService accessService;
    private CourseAccessCodeService service;
    private Course course;
    private User student;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        codeRepository = mock(CourseAccessCodeRepository.class);
        CourseRepository courseRepository = mock(CourseRepository.class);
        enrollmentRepository = mock(CourseEnrollmentRepository.class);
        accessService = mock(CourseAccessService.class);
        NotificationService notificationService = mock(NotificationService.class);
        authentication = mock(Authentication.class);
        service = new CourseAccessCodeService(
                codeRepository, courseRepository, enrollmentRepository, accessService, notificationService
        );

        course = new Course();
        course.setId(5L);
        course.setName("Java");
        student = new User();
        student.setId(7L);
        student.setEmail("student@example.com");
        student.setRole(Role.STUDENT);

        when(courseRepository.findById(5L)).thenReturn(Optional.of(course));
        when(codeRepository.existsByCodeHash(any())).thenReturn(false);
        when(codeRepository.save(any())).thenAnswer(call -> call.getArgument(0));
        when(enrollmentRepository.save(any())).thenAnswer(call -> call.getArgument(0));
        when(accessService.currentUser(authentication)).thenReturn(student);
        when(accessService.isAdmin(student)).thenReturn(false);
    }

    @Test
    void generatesSingleUseCodeExpiringAfterFourteenDays() {
        LocalDateTime before = LocalDateTime.now().plusDays(14).minusSeconds(2);
        AccessCodeDto result = service.create(new AccessCodeCreateRequest(5L, AccessCodeType.THIRTY_DAYS));

        assertNotNull(result.code());
        assertTrue(result.code().matches("[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}"));
        assertTrue(result.expiresAt().isAfter(before));
        assertEquals("ACTIVE", result.status());
    }

    @Test
    void redeemingThirtyDayCodeActivatesEnrollmentAndConsumesCode() {
        CourseAccessCode code = activeCode(AccessCodeType.THIRTY_DAYS);
        when(codeRepository.findByCodeHash(any())).thenReturn(Optional.of(code));
        when(enrollmentRepository.findByUserIdAndCourseId(7L, 5L)).thenReturn(Optional.empty());

        AccessCodeRedemptionDto result = service.redeem("ABCD-EFGH-JKLM", authentication);

        assertNotNull(result.accessUntil());
        assertFalse(result.unlimited());
        assertNotNull(code.getRedeemedAt());
        assertEquals(student, code.getRedeemedBy());
        verify(enrollmentRepository).save(argThat(enrollment -> enrollment.isActive()
                && enrollment.getSource() == EnrollmentSource.ACCESS_CODE));
    }

    @Test
    void expiredCodeCannotBeRedeemed() {
        CourseAccessCode code = activeCode(AccessCodeType.UNLIMITED);
        code.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        when(codeRepository.findByCodeHash(any())).thenReturn(Optional.of(code));

        assertThrows(ResponseStatusException.class,
                () -> service.redeem("ABCD-EFGH-JKLM", authentication));
        verify(enrollmentRepository, never()).save(any());
    }

    private CourseAccessCode activeCode(AccessCodeType type) {
        CourseAccessCode code = new CourseAccessCode();
        code.setCourse(course);
        code.setAccessType(type);
        code.setCodeHash("hash");
        code.setCodePreview("ABCD-…-JKLM");
        code.setCreatedAt(LocalDateTime.now());
        code.setExpiresAt(LocalDateTime.now().plusDays(14));
        return code;
    }
}

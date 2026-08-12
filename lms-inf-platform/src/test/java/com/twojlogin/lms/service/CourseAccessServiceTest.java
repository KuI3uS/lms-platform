package com.twojlogin.lms.service;

import com.twojlogin.lms.entity.Course;
import com.twojlogin.lms.entity.Role;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

class CourseAccessServiceTest {

    private CourseEnrollmentRepository enrollmentRepository;
    private CourseAccessService service;
    private User user;
    private Course course;

    @BeforeEach
    void setUp() {
        enrollmentRepository = mock(CourseEnrollmentRepository.class);
        service = new CourseAccessService(
                mock(UserRepository.class),
                mock(CourseRepository.class),
                mock(CourseModuleRepository.class),
                mock(LessonRepository.class),
                enrollmentRepository,
                mock(CourseOrderRepository.class)
        );

        user = new User();
        user.setId(7L);
        user.setRole(Role.STUDENT);

        course = new Course();
        course.setId(11L);
        course.setPublished(true);
        course.setPrice(new BigDecimal("1000"));
    }

    @Test
    void paidCourseRequiresActiveEnrollmentForRegularUser() {
        when(enrollmentRepository.hasActiveAccess(
                eq(7L), eq(11L), any(LocalDateTime.class)
        ))
                .thenReturn(false);

        assertFalse(service.hasAccess(user, course));
    }

    @Test
    void activeEnrollmentUnlocksPaidCourse() {
        when(enrollmentRepository.hasActiveAccess(
                eq(7L), eq(11L), any(LocalDateTime.class)
        ))
                .thenReturn(true);

        assertTrue(service.hasAccess(user, course));
    }

    @Test
    void administratorAlwaysHasAccess() {
        user.setRole(Role.ADMIN);

        assertTrue(service.hasAccess(user, course));
    }

    @Test
    void freeCourseDoesNotRequireEnrollment() {
        course.setPrice(BigDecimal.ZERO);

        assertTrue(service.hasAccess(user, course));
    }
}

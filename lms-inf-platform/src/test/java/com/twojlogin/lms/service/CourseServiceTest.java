package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.CourseSummaryDto;
import com.twojlogin.lms.entity.Course;
import com.twojlogin.lms.entity.Role;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.CourseCertificateRepository;
import com.twojlogin.lms.repository.CourseEnrollmentRepository;
import com.twojlogin.lms.repository.CourseModuleRepository;
import com.twojlogin.lms.repository.CourseOrderRepository;
import com.twojlogin.lms.repository.CourseRepository;
import com.twojlogin.lms.repository.ExamAttemptRepository;
import com.twojlogin.lms.repository.LessonProgressRepository;
import com.twojlogin.lms.repository.LessonRepository;
import com.twojlogin.lms.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.any;

@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock
    private CourseRepository courseRepository;
    @Mock
    private CourseModuleRepository moduleRepository;
    @Mock
    private LessonRepository lessonRepository;
    @Mock
    private LessonProgressRepository lessonProgressRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CourseEnrollmentRepository enrollmentRepository;
    @Mock
    private CourseOrderRepository orderRepository;
    @Mock
    private CourseCertificateRepository certificateRepository;
    @Mock
    private ExamAttemptRepository examAttemptRepository;

    private CourseService courseService;

    @BeforeEach
    void setUp() {
        courseService = new CourseService(
                courseRepository,
                moduleRepository,
                lessonRepository,
                lessonProgressRepository,
                userRepository,
                enrollmentRepository,
                orderRepository,
                certificateRepository,
                examAttemptRepository
        );
    }

    @Test
    void getAllLoadsMetricsAndAccessInBatches() {
        User user = new User();
        user.setId(7L);
        user.setEmail("student@example.com");
        user.setRole(Role.STUDENT);

        Course pendingCourse = paidCourse(1L, "Kurs oczekujący");
        Course activeCourse = paidCourse(2L, "Aktywny kurs");
        List<Long> courseIds = List.of(1L, 2L);

        when(userRepository.findByEmail("student@example.com"))
                .thenReturn(Optional.of(user));
        when(courseRepository.findByPublishedTrueOrderByIdAsc())
                .thenReturn(List.of(pendingCourse, activeCourse));
        when(moduleRepository.countByCourseIds(courseIds))
                .thenReturn(List.of(new Object[]{1L, 2L}, new Object[]{2L, 3L}));
        when(lessonRepository.countByCourseIds(courseIds))
                .thenReturn(List.of(new Object[]{1L, 10L}, new Object[]{2L, 4L}));
        when(lessonProgressRepository.countCompletedByUserIdAndCourseIds(7L, courseIds))
                .thenReturn(List.of(new Object[]{1L, 2L}, new Object[]{2L, 3L}));
        when(enrollmentRepository.findAccessibleCoursesByUserId(
                org.mockito.ArgumentMatchers.eq(7L),
                any(LocalDateTime.class)
        )).thenReturn(List.<Object[]>of(new Object[]{2L, null}));
        when(orderRepository.findPendingCourseIdsByUserId(7L))
                .thenReturn(List.of(1L));

        var authentication = new UsernamePasswordAuthenticationToken(
                "student@example.com",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))
        );

        List<CourseSummaryDto> summaries = courseService.getAll(authentication);

        assertEquals(2, summaries.size());
        assertEquals(20, summaries.get(0).progress());
        assertEquals("PENDING", summaries.get(0).accessStatus());
        assertFalse(summaries.get(0).canAccess());
        assertEquals(75, summaries.get(1).progress());
        assertEquals("ACTIVE", summaries.get(1).accessStatus());
        assertTrue(summaries.get(1).canAccess());

        verify(moduleRepository).countByCourseIds(courseIds);
        verify(lessonRepository).countByCourseIds(courseIds);
        verify(lessonProgressRepository).countCompletedByUserIdAndCourseIds(7L, courseIds);
        verify(moduleRepository, never()).countByCourseId(1L);
        verify(moduleRepository, never()).countByCourseId(2L);
    }

    private Course paidCourse(Long id, String name) {
        Course course = new Course();
        course.setId(id);
        course.setName(name);
        course.setPrice(BigDecimal.valueOf(100));
        course.setPublished(true);
        return course;
    }
}

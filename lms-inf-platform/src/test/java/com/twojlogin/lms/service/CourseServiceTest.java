package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.CourseSummaryDto;
import com.twojlogin.lms.dto.CourseRequest;
import com.twojlogin.lms.entity.CourseBillingMode;
import com.twojlogin.lms.entity.Course;
import com.twojlogin.lms.entity.CourseModule;
import com.twojlogin.lms.entity.Role;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.CourseCertificateRepository;
import com.twojlogin.lms.repository.CourseEnrollmentRepository;
import com.twojlogin.lms.repository.CourseModuleRepository;
import com.twojlogin.lms.repository.CourseOrderRepository;
import com.twojlogin.lms.repository.CourseRepository;
import com.twojlogin.lms.repository.ExamAttemptRepository;
import com.twojlogin.lms.repository.CourseProgressRepository;
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
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
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
    @Mock
    private CourseProgressRepository courseProgressRepository;
    @Mock
    private CourseModuleDeletionService moduleDeletionService;

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
                examAttemptRepository,
                courseProgressRepository,
                moduleDeletionService
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

    @Test
    void deleteRemovesModulesAndAllCourseRelations() {
        CourseModule firstModule = new CourseModule();
        firstModule.setId(11L);
        CourseModule secondModule = new CourseModule();
        secondModule.setId(12L);

        when(courseRepository.existsById(3L)).thenReturn(true);
        when(moduleRepository.findByCourseIdOrderByIdAsc(3L))
                .thenReturn(List.of(firstModule, secondModule));

        courseService.delete(3L);

        verify(examAttemptRepository).deleteByCourseId(3L);
        verify(certificateRepository).deleteByCourseId(3L);
        verify(orderRepository).deleteByCourseId(3L);
        verify(enrollmentRepository).deleteByCourseId(3L);
        verify(courseProgressRepository).deleteByCourseId(3L);
        verify(moduleDeletionService).delete(11L);
        verify(moduleDeletionService).delete(12L);
        verify(courseRepository).deleteById(3L);
    }

    @Test
    void catalogsSeparateAuthoredLanguageFromTheLanguageBeingTaught() {
        var auth = authenticated("STUDENT");
        Course polish = paidCourse(1L, "Angielski dla początkujących");
        polish.setCategory("LANGUAGE");
        polish.setCourseLanguage("ENGLISH");
        Course english = paidCourse(2L, "Java in English");
        english.setContentLanguage("en");
        Course spanish = paidCourse(3L, "Java en español");
        spanish.setContentLanguage("es");
        when(courseRepository.findByPublishedTrueOrderByIdAsc()).thenReturn(List.of(polish, english, spanish));

        assertEquals(List.of(1L), courseService.getAll(auth).stream().map(CourseSummaryDto::id).toList());
        assertEquals(List.of(2L), courseService.getAll(auth, "en", false).stream().map(CourseSummaryDto::id).toList());
        assertEquals(List.of(3L), courseService.getAll(auth, "es", false).stream().map(CourseSummaryDto::id).toList());
        verify(lessonRepository).countByCourseIds(List.of(2L));
        assertEquals("pl", polish.getContentLanguage());
        assertEquals("ENGLISH", polish.getCourseLanguage());
    }

    @Test
    void switchingCatalogDoesNotRevokeAnExistingPurchaseOrItsExpiry() {
        var auth = authenticated("STUDENT");
        Course polish = paidCourse(1L, "Polski kurs");
        Course english = paidCourse(2L, "English course");
        english.setContentLanguage("en");
        var expiry = LocalDateTime.of(2027, 1, 1, 12, 0);
        when(courseRepository.findByPublishedTrueOrderByIdAsc()).thenReturn(List.of(polish, english));
        when(courseRepository.findById(1L)).thenReturn(Optional.of(polish));
        when(enrollmentRepository.findAccessibleCoursesByUserId(
                org.mockito.ArgumentMatchers.eq(7L), any(LocalDateTime.class)))
                .thenReturn(List.<Object[]>of(new Object[]{1L, expiry}));

        assertTrue(courseService.getMy(auth, "en").isEmpty());
        assertEquals(List.of(1L), courseService.getMy(auth, "pl").stream().map(CourseSummaryDto::id).toList());
        var purchased = courseService.getById(1L, auth);
        assertTrue(purchased.canAccess());
        assertEquals(expiry, purchased.accessExpiresAt());
        verify(enrollmentRepository, never()).deleteByCourseId(any());
    }

    @Test
    void onlyAdministratorMayRequestAllLanguageVersionsIncludingDrafts() {
        var auth = authenticated("ADMIN");
        Course polish = paidCourse(1L, "PL");
        Course english = paidCourse(2L, "EN draft");
        english.setContentLanguage("en");
        english.setPublished(false);
        when(courseRepository.findAllByOrderByIdAsc()).thenReturn(List.of(polish, english));
        assertEquals(2, courseService.getAll(auth, "es", true).size());
        assertEquals(List.of(2L), courseService.getAll(auth, "en", false).stream().map(CourseSummaryDto::id).toList());
    }

    @Test
    void studentCannotBypassCatalogFilterAndUnknownLanguagesAreRejected() {
        var auth = authenticated("STUDENT");
        assertEquals(HttpStatus.FORBIDDEN, assertThrows(ResponseStatusException.class,
                () -> courseService.getAll(auth, "en", true)).getStatusCode());
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class,
                () -> courseService.getAll(auth, "fr", false)).getStatusCode());
        verify(courseRepository, never()).findByPublishedTrueOrderByIdAsc();
    }

    @Test
    void oldClientEditingEnglishCourseDoesNotReassignItToPolish() {
        var auth = authenticated("ADMIN");
        Course english = paidCourse(2L, "English course");
        english.setContentLanguage("en");
        when(courseRepository.findById(2L)).thenReturn(Optional.of(english));
        when(courseRepository.save(any(Course.class))).thenAnswer(invocation -> invocation.getArgument(0));
        assertEquals("en", courseService.update(2L, request(null), auth).contentLanguage());
    }

    @Test
    void newCourseAcceptsSpanishWhileLegacyCreateDefaultsToPolish() {
        var auth = authenticated("ADMIN");
        when(courseRepository.save(any(Course.class))).thenAnswer(invocation -> {
            Course course = invocation.getArgument(0);
            course.setId(9L);
            return course;
        });
        assertEquals("es", courseService.create(request("ES"), auth).contentLanguage());
        assertEquals("pl", courseService.create(request(null), auth).contentLanguage());
        assertEquals(HttpStatus.BAD_REQUEST, assertThrows(ResponseStatusException.class,
                () -> courseService.create(request("de"), auth)).getStatusCode());
    }

    private UsernamePasswordAuthenticationToken authenticated(String role) {
        User user = new User();
        user.setId(7L);
        user.setEmail("locale@example.com");
        user.setRole(Role.valueOf(role));
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        return new UsernamePasswordAuthenticationToken(user.getEmail(), null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role)));
    }

    private CourseRequest request(String contentLanguage) {
        return new CourseRequest("Course", "Course", "Description", BigDecimal.ZERO, true,
                null, "Podstawy", null, CourseBillingMode.FREE, BigDecimal.ZERO,
                null, "PROGRAMMING", null, null, null, contentLanguage);
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

package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.CourseRequest;
import com.twojlogin.lms.dto.CourseSummaryDto;
import com.twojlogin.lms.entity.Course;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.CourseModuleRepository;
import com.twojlogin.lms.repository.CourseRepository;
import com.twojlogin.lms.repository.LessonProgressRepository;
import com.twojlogin.lms.repository.LessonRepository;
import com.twojlogin.lms.repository.UserRepository;
import com.twojlogin.lms.repository.CourseEnrollmentRepository;
import com.twojlogin.lms.repository.CourseOrderRepository;
import com.twojlogin.lms.repository.CourseCertificateRepository;
import com.twojlogin.lms.repository.ExamAttemptRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final CourseModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final UserRepository userRepository;
    private final CourseAccessService accessService;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final CourseOrderRepository orderRepository;
    private final CourseCertificateRepository certificateRepository;
    private final ExamAttemptRepository examAttemptRepository;

    public CourseService(
            CourseRepository courseRepository,
            CourseModuleRepository moduleRepository,
            LessonRepository lessonRepository,
            LessonProgressRepository lessonProgressRepository,
            UserRepository userRepository,
            CourseAccessService accessService,
            CourseEnrollmentRepository enrollmentRepository,
            CourseOrderRepository orderRepository,
            CourseCertificateRepository certificateRepository,
            ExamAttemptRepository examAttemptRepository
    ) {
        this.courseRepository = courseRepository;
        this.moduleRepository = moduleRepository;
        this.lessonRepository = lessonRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.userRepository = userRepository;
        this.accessService = accessService;
        this.enrollmentRepository = enrollmentRepository;
        this.orderRepository = orderRepository;
        this.certificateRepository = certificateRepository;
        this.examAttemptRepository = examAttemptRepository;
    }

    @Transactional(readOnly = true)
    public List<CourseSummaryDto> getAll(Authentication authentication) {
        User user = getCurrentUser(authentication);
        List<Course> courses = isAdmin(authentication)
                ? courseRepository.findAllByOrderByIdAsc()
                : courseRepository.findByPublishedTrueOrderByIdAsc();

        return courses.stream()
                .map(course -> toSummary(course, user, isAdmin(authentication)))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CourseSummaryDto> getMy(Authentication authentication) {
        User user = getCurrentUser(authentication);
        boolean admin = isAdmin(authentication);
        List<Course> courses = admin
                ? courseRepository.findAllByOrderByIdAsc()
                : courseRepository.findByPublishedTrueOrderByIdAsc().stream()
                        .filter(course -> accessService.hasAccess(user, course))
                        .toList();

        return courses.stream()
                .map(course -> toSummary(course, user, admin))
                .toList();
    }

    @Transactional(readOnly = true)
    public CourseSummaryDto getById(Long id, Authentication authentication) {
        User user = getCurrentUser(authentication);
        Course course = findCourse(id);

        if (!course.isPublished() && !isAdmin(authentication)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Kurs nie istnieje");
        }

        return toSummary(course, user, isAdmin(authentication));
    }

    @Transactional
    public CourseSummaryDto create(CourseRequest request, Authentication authentication) {
        User user = getCurrentUser(authentication);
        Course course = new Course();
        applyRequest(course, request);

        return toSummary(courseRepository.save(course), user, true);
    }

    @Transactional
    public CourseSummaryDto update(Long id, CourseRequest request, Authentication authentication) {
        User user = getCurrentUser(authentication);
        Course course = findCourse(id);
        applyRequest(course, request);

        return toSummary(courseRepository.save(course), user, true);
    }

    @Transactional
    public void delete(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Kurs nie istnieje");
        }

        examAttemptRepository.deleteByCourseId(id);
        certificateRepository.deleteByCourseId(id);
        orderRepository.deleteByCourseId(id);
        enrollmentRepository.deleteByCourseId(id);
        courseRepository.deleteById(id);
    }

    private Course findCourse(Long id) {
        return courseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Kurs nie istnieje"
                ));
    }

    private User getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wymagane logowanie");
        }

        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Nie znaleziono użytkownika"
                ));
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }

    private CourseSummaryDto toSummary(Course course, User user, boolean admin) {
        long moduleCount = moduleRepository.countByCourseId(course.getId());
        long lessonCount = lessonRepository.countByModuleCourseId(course.getId());
        long completedLessonCount = lessonProgressRepository
                .countCompletedByUserIdAndCourseId(user.getId(), course.getId());
        int progress = lessonCount == 0
                ? 0
                : (int) Math.round(completedLessonCount * 100.0 / lessonCount);

        String accessStatus = accessService.accessStatus(user, course);
        boolean canAccess = accessService.hasAccess(user, course);
        boolean paid = !accessService.isFree(course);

        return new CourseSummaryDto(
                course.getId(),
                course.getName(),
                course.getTitle(),
                course.getDescription(),
                course.getPrice(),
                course.isPublished(),
                course.getThumbnailUrl(),
                course.getLevel(),
                moduleCount,
                lessonCount,
                completedLessonCount,
                progress,
                paid,
                canAccess,
                "ACTIVE".equals(accessStatus) || "ADMIN".equals(accessStatus),
                accessStatus,
                admin ? course.getPaymentUrl() : null
        );
    }

    private void applyRequest(Course course, CourseRequest request) {
        String name = clean(request.name());

        if (name == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nazwa kursu jest wymagana"
            );
        }

        BigDecimal price = request.price() == null ? BigDecimal.ZERO : request.price();
        if (price.signum() < 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Cena nie może być ujemna"
            );
        }

        course.setName(name);
        course.setTitle(clean(request.title()));
        course.setDescription(clean(request.description()));
        course.setPrice(price);
        course.setPublished(request.published());
        course.setThumbnailUrl(clean(request.thumbnailUrl()));
        course.setLevel(clean(request.level()) == null ? "Podstawy" : clean(request.level()));
        course.setPaymentUrl(clean(request.paymentUrl()));
    }

    private String clean(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}

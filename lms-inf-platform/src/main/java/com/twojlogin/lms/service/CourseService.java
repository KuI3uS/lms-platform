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
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class CourseService {

    private static final Set<String> COURSE_CATEGORIES = Set.of(
            "PROGRAMMING",
            "DIGITAL_SKILLS",
            "LANGUAGE"
    );
    private static final Set<String> COURSE_LANGUAGES = Set.of(
            "ENGLISH",
            "GERMAN",
            "SPANISH",
            "FRENCH",
            "POLISH"
    );
    private static final Set<String> CEFR_LEVELS = Set.of(
            "A1",
            "A2",
            "B1",
            "B2",
            "C1",
            "C2"
    );

    private final CourseRepository courseRepository;
    private final CourseModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final UserRepository userRepository;
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
        this.enrollmentRepository = enrollmentRepository;
        this.orderRepository = orderRepository;
        this.certificateRepository = certificateRepository;
        this.examAttemptRepository = examAttemptRepository;
    }

    @Transactional(readOnly = true)
    public List<CourseSummaryDto> getAll(Authentication authentication) {
        User user = getCurrentUser(authentication);
        boolean admin = isAdmin(authentication);
        List<Course> courses = admin
                ? courseRepository.findAllByOrderByIdAsc()
                : courseRepository.findByPublishedTrueOrderByIdAsc();

        return summarize(courses, user, admin);
    }

    @Transactional(readOnly = true)
    public List<CourseSummaryDto> getMy(Authentication authentication) {
        User user = getCurrentUser(authentication);
        boolean admin = isAdmin(authentication);
        List<Course> courses = admin
                ? courseRepository.findAllByOrderByIdAsc()
                : courseRepository.findByPublishedTrueOrderByIdAsc();
        List<CourseSummaryDto> summaries = summarize(courses, user, admin);

        return admin
                ? summaries
                : summaries.stream().filter(CourseSummaryDto::canAccess).toList();
    }

    @Transactional(readOnly = true)
    public CourseSummaryDto getById(Long id, Authentication authentication) {
        User user = getCurrentUser(authentication);
        Course course = findCourse(id);

        if (!course.isPublished() && !isAdmin(authentication)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Kurs nie istnieje");
        }

        return summarize(List.of(course), user, isAdmin(authentication)).get(0);
    }

    @Transactional
    public CourseSummaryDto create(CourseRequest request, Authentication authentication) {
        User user = getCurrentUser(authentication);
        Course course = new Course();
        applyRequest(course, request);

        return summarize(List.of(courseRepository.save(course)), user, true).get(0);
    }

    @Transactional
    public CourseSummaryDto update(Long id, CourseRequest request, Authentication authentication) {
        User user = getCurrentUser(authentication);
        Course course = findCourse(id);
        applyRequest(course, request);

        return summarize(List.of(courseRepository.save(course)), user, true).get(0);
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

    private List<CourseSummaryDto> summarize(
            List<Course> courses,
            User user,
            boolean admin
    ) {
        if (courses.isEmpty()) {
            return List.of();
        }

        List<Long> courseIds = courses.stream().map(Course::getId).toList();
        Map<Long, Long> moduleCounts = toCountMap(
                moduleRepository.countByCourseIds(courseIds)
        );
        Map<Long, Long> lessonCounts = toCountMap(
                lessonRepository.countByCourseIds(courseIds)
        );
        Map<Long, Long> completedLessonCounts = toCountMap(
                lessonProgressRepository.countCompletedByUserIdAndCourseIds(
                        user.getId(),
                        courseIds
                )
        );
        Set<Long> activeCourseIds = admin
                ? Set.of()
                : Set.copyOf(enrollmentRepository.findActiveCourseIdsByUserId(user.getId()));
        Set<Long> pendingCourseIds = admin
                ? Set.of()
                : Set.copyOf(orderRepository.findPendingCourseIdsByUserId(user.getId()));

        return courses.stream()
                .map(course -> toSummary(
                        course,
                        admin,
                        moduleCounts.getOrDefault(course.getId(), 0L),
                        lessonCounts.getOrDefault(course.getId(), 0L),
                        completedLessonCounts.getOrDefault(course.getId(), 0L),
                        activeCourseIds,
                        pendingCourseIds
                ))
                .toList();
    }

    private CourseSummaryDto toSummary(
            Course course,
            boolean admin,
            long moduleCount,
            long lessonCount,
            long completedLessonCount,
            Set<Long> activeCourseIds,
            Set<Long> pendingCourseIds
    ) {
        int progress = lessonCount == 0
                ? 0
                : (int) Math.round(completedLessonCount * 100.0 / lessonCount);

        boolean paid = course.getPrice() != null
                && course.getPrice().compareTo(BigDecimal.ZERO) > 0;
        boolean active = activeCourseIds.contains(course.getId());
        String accessStatus = admin
                ? "ADMIN"
                : !paid
                        ? "FREE"
                        : active
                                ? "ACTIVE"
                                : pendingCourseIds.contains(course.getId())
                                        ? "PENDING"
                                        : "LOCKED";
        boolean canAccess = admin || !paid || active;

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
                admin ? course.getPaymentUrl() : null,
                course.getCategory(),
                course.getCourseLanguage(),
                course.getCefrLevel()
        );
    }

    private Map<Long, Long> toCountMap(List<Object[]> rows) {
        Map<Long, Long> counts = new HashMap<>();
        for (Object[] row : rows) {
            counts.put(
                    ((Number) row[0]).longValue(),
                    ((Number) row[1]).longValue()
            );
        }
        return counts;
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

        String category = uppercase(request.category());
        if (category == null) {
            category = course.getCategory();
        }
        if (!COURSE_CATEGORIES.contains(category)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Nieprawidłowa kategoria kursu"
            );
        }
        course.setCategory(category);

        if ("LANGUAGE".equals(category)) {
            String language = uppercase(request.courseLanguage());
            String cefrLevel = uppercase(request.cefrLevel());

            if (language == null || cefrLevel == null
                    || !COURSE_LANGUAGES.contains(language)
                    || !CEFR_LEVELS.contains(cefrLevel)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Kurs językowy wymaga języka i poziomu od A1 do C2"
                );
            }

            course.setCourseLanguage(language);
            course.setCefrLevel(cefrLevel);
        } else {
            course.setCourseLanguage(null);
            course.setCefrLevel(null);
        }
    }

    private String clean(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private String uppercase(String value) {
        String cleaned = clean(value);
        return cleaned == null ? null : cleaned.toUpperCase(Locale.ROOT);
    }
}

package com.twojlogin.lms.service;

import com.twojlogin.lms.entity.Course;
import com.twojlogin.lms.entity.CourseBillingMode;
import com.twojlogin.lms.entity.CourseModule;
import com.twojlogin.lms.entity.CourseOrderStatus;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.entity.Role;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.CourseEnrollmentRepository;
import com.twojlogin.lms.repository.CourseModuleRepository;
import com.twojlogin.lms.repository.CourseOrderRepository;
import com.twojlogin.lms.repository.CourseRepository;
import com.twojlogin.lms.repository.LessonRepository;
import com.twojlogin.lms.repository.LessonBlockRepository;
import com.twojlogin.lms.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
public class CourseAccessService {

    private static final ZoneId WARSAW_ZONE = ZoneId.of("Europe/Warsaw");

    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final CourseModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final LessonBlockRepository lessonBlockRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final CourseOrderRepository orderRepository;
    private final LanguageProgressService languageProgressService;

    public CourseAccessService(
            UserRepository userRepository,
            CourseRepository courseRepository,
            CourseModuleRepository moduleRepository,
            LessonRepository lessonRepository,
            LessonBlockRepository lessonBlockRepository,
            CourseEnrollmentRepository enrollmentRepository,
            CourseOrderRepository orderRepository,
            LanguageProgressService languageProgressService
    ) {
        this.userRepository = userRepository;
        this.courseRepository = courseRepository;
        this.moduleRepository = moduleRepository;
        this.lessonRepository = lessonRepository;
        this.lessonBlockRepository = lessonBlockRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.orderRepository = orderRepository;
        this.languageProgressService = languageProgressService;
    }

    public User currentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wymagane logowanie");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Nie znaleziono użytkownika"
                ));
    }

    public boolean isAdmin(User user) {
        return user.getRole() == Role.ADMIN;
    }

    public boolean isFree(Course course) {
        return course.getBillingMode() == CourseBillingMode.FREE;
    }

    public boolean hasAccess(User user, Course course) {
        return isAdmin(user)
                || isFree(course)
                || enrollmentRepository.hasActiveAccess(
                        user.getId(),
                        course.getId(),
                        LocalDateTime.now(WARSAW_ZONE)
                );
    }

    public boolean hasPendingOrder(User user, Course course) {
        return orderRepository
                .findFirstByUserIdAndCourseIdAndStatusOrderByCreatedAtDesc(
                        user.getId(),
                        course.getId(),
                        CourseOrderStatus.PENDING
                )
                .isPresent();
    }

    public String accessStatus(User user, Course course) {
        if (isAdmin(user)) return "ADMIN";
        if (isFree(course)) return "FREE";
        if (enrollmentRepository.hasActiveAccess(
                user.getId(),
                course.getId(),
                LocalDateTime.now(WARSAW_ZONE)
        )) return "ACTIVE";
        if (hasPendingOrder(user, course)) return "PENDING";
        return "LOCKED";
    }

    public Course requireCourseAccess(Long courseId, Authentication authentication) {
        User user = currentUser(authentication);
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Kurs nie istnieje"
                ));
        requireAccess(user, course);
        return course;
    }

    public CourseModule requireModuleAccess(Long moduleId, Authentication authentication) {
        User user = currentUser(authentication);
        CourseModule module = moduleRepository.findById(moduleId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Moduł nie istnieje"
                ));
        requireAccess(user, module.getCourse());
        requireLevelAccess(user, module);
        return module;
    }

    public Lesson requireLessonAccess(Long lessonId, Authentication authentication) {
        User user = currentUser(authentication);
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Lekcja nie istnieje"
                ));
        requireLessonAccess(user, lesson);
        return lesson;
    }

    public void requireLessonAccess(User user, Lesson lesson) {
        if ((!lesson.getModule().getCourse().isPublished()
                || !lesson.isPublished()) && !isAdmin(user)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Lekcja nie istnieje");
        }
        if (!isAdmin(user)
                && lessonBlockRepository.countByLessonIdAndPublishedTrue(
                lesson.getId()
        ) == 0) {
            throw new ResponseStatusException(
                    HttpStatus.LOCKED,
                    "Materiały tej lekcji są jeszcze w przygotowaniu"
            );
        }
        if (!lesson.isFreePreview()) {
            requireAccess(user, lesson.getModule().getCourse());
            requireLevelAccess(user, lesson.getModule());
        }
    }

    public boolean hasLevelAccess(User user, CourseModule module) {
        return isAdmin(user)
                || !languageProgressService.isLanguageCourse(module.getCourse())
                || languageProgressService.isLevelUnlocked(
                        user,
                        module.getCourse(),
                        module.getCefrLevel()
                );
    }

    public String unlockedCefrLevel(User user, Course course) {
        return isAdmin(user)
                ? languageProgressService.endLevel(course)
                : languageProgressService.unlockedLevel(user, course);
    }

    public void requireLevelAccess(User user, CourseModule module) {
        if (!hasLevelAccess(user, module)) {
            throw new ResponseStatusException(
                    HttpStatus.LOCKED,
                    "Najpierw zdaj egzamin poprzedniego poziomu albo egzamin kwalifikacyjny"
            );
        }
    }

    public void requireAccess(User user, Course course) {
        if (!course.isPublished() && !isAdmin(user)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Kurs nie istnieje");
        }
        if (!hasAccess(user, course)) {
            throw new ResponseStatusException(
                    HttpStatus.PAYMENT_REQUIRED,
                    "Ten kurs wymaga aktywnego dostępu"
            );
        }
    }
}

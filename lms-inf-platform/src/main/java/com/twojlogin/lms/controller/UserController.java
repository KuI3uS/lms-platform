package com.twojlogin.lms.controller;

import com.twojlogin.lms.entity.Role;
import com.twojlogin.lms.dto.AuthenticatedUserDto;
import com.twojlogin.lms.dto.SubmissionResultDto;
import com.twojlogin.lms.dto.UserDto;
import com.twojlogin.lms.repository.SchoolClassRepository;
import com.twojlogin.lms.repository.SubmissionRepository;
import com.twojlogin.lms.repository.UserRepository;
import com.twojlogin.lms.repository.LessonProgressRepository;
import com.twojlogin.lms.repository.TaskAttemptRepository;
import com.twojlogin.lms.repository.CourseEnrollmentRepository;
import com.twojlogin.lms.repository.CourseOrderRepository;
import com.twojlogin.lms.repository.UserNotificationRepository;
import com.twojlogin.lms.repository.UserAchievementRepository;
import com.twojlogin.lms.repository.CourseCertificateRepository;
import com.twojlogin.lms.repository.StudyActivityRepository;
import com.twojlogin.lms.repository.ExamAttemptRepository;
import com.twojlogin.lms.repository.GamificationProfileRepository;
import com.twojlogin.lms.repository.TutoringBookingRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;
import com.twojlogin.lms.entity.User;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.twojlogin.lms.entity.SchoolClass;
import com.twojlogin.lms.util.ClassNameNormalizer;

import java.util.List;

@RestController
@RequestMapping("/api")
public class UserController {

    private final UserRepository userRepository;
    private final SubmissionRepository submissionRepository;
    private final SchoolClassRepository schoolClassRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final TaskAttemptRepository taskAttemptRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final CourseOrderRepository orderRepository;
    private final UserNotificationRepository notificationRepository;
    private final UserAchievementRepository achievementRepository;
    private final CourseCertificateRepository certificateRepository;
    private final StudyActivityRepository activityRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final TutoringBookingRepository tutoringBookingRepository;
    private final GamificationProfileRepository gamificationProfileRepository;

    public UserController(UserRepository userRepository,
                          SubmissionRepository submissionRepository,
                          SchoolClassRepository schoolClassRepository,
                          LessonProgressRepository lessonProgressRepository,
                          TaskAttemptRepository taskAttemptRepository,
                          CourseEnrollmentRepository enrollmentRepository,
                          CourseOrderRepository orderRepository,
                          UserNotificationRepository notificationRepository,
                          UserAchievementRepository achievementRepository,
                          CourseCertificateRepository certificateRepository,
                          StudyActivityRepository activityRepository,
                          ExamAttemptRepository examAttemptRepository,
                          TutoringBookingRepository tutoringBookingRepository,
                          GamificationProfileRepository gamificationProfileRepository) {
        this.userRepository = userRepository;
        this.submissionRepository = submissionRepository;
        this.schoolClassRepository = schoolClassRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.taskAttemptRepository = taskAttemptRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.orderRepository = orderRepository;
        this.notificationRepository = notificationRepository;
        this.achievementRepository = achievementRepository;
        this.certificateRepository = certificateRepository;
        this.activityRepository = activityRepository;
        this.examAttemptRepository = examAttemptRepository;
        this.tutoringBookingRepository = tutoringBookingRepository;
        this.gamificationProfileRepository = gamificationProfileRepository;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/users")
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream().map(UserDto::from).toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/users/{id}/role")
    public UserDto changeRole(@PathVariable Long id, @RequestParam String role) {
        User user = userRepository.findById(id)
                .orElseThrow();

        user.setRole(Role.valueOf(role));
        return UserDto.from(userRepository.save(user));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/users/{id}")
    @Transactional
    public void deleteUser(@PathVariable Long id) {
        submissionRepository.deleteByUserId(id);
        taskAttemptRepository.deleteByUserId(id);
        lessonProgressRepository.deleteByUserId(id);
        examAttemptRepository.deleteByUserId(id);
        certificateRepository.deleteByUserId(id);
        achievementRepository.deleteByUserId(id);
        notificationRepository.deleteByUserId(id);
        activityRepository.deleteByUserId(id);
        orderRepository.clearConfirmedBy(id);
        orderRepository.deleteByUserId(id);
        enrollmentRepository.deleteByUserId(id);
        gamificationProfileRepository.deleteByUserId(id);
        tutoringBookingRepository.clearStudent(id);
        userRepository.deleteById(id);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/class/{id}/users")
    public List<UserDto> getUsersByClass(@PathVariable Long id) {
        return userRepository.findBySchoolClassId(id).stream().map(UserDto::from).toList();
    }

    @GetMapping("/me")
    public AuthenticatedUserDto me(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        return AuthenticatedUserDto.from(user);
    }

    @GetMapping("/my-results")
    public List<SubmissionResultDto> myResults(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow();

        return submissionRepository.findByUserId(user.getId()).stream()
                .map(SubmissionResultDto::from)
                .toList();
    }
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/users/{id}/class")
    public UserDto changeClass(@PathVariable Long id, @RequestParam String className) {
        User user = userRepository.findById(id)
                .orElseThrow();

        String normalizedClassName = ClassNameNormalizer.normalize(className);

        SchoolClass schoolClass = schoolClassRepository
                .findByName(normalizedClassName)
                .orElseGet(() -> {
                    SchoolClass newClass = new SchoolClass();
                    newClass.setName(normalizedClassName);
                    return schoolClassRepository.save(newClass);
                });

        user.setSchoolClass(schoolClass);

        return UserDto.from(userRepository.save(user));
    }
}

package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.LearningAnalyticsDto;
import com.twojlogin.lms.entity.ExamAttemptStatus;
import com.twojlogin.lms.entity.StudyActivity;
import com.twojlogin.lms.entity.TaskAttempt;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.*;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;

@Service
public class LearningAnalyticsService {

    private final CourseAccessService accessService;
    private final StudyActivityRepository activityRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final TaskAttemptRepository taskAttemptRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final AchievementService achievementService;
    private final CourseCertificateRepository certificateRepository;

    public LearningAnalyticsService(
            CourseAccessService accessService,
            StudyActivityRepository activityRepository,
            LessonProgressRepository lessonProgressRepository,
            TaskAttemptRepository taskAttemptRepository,
            ExamAttemptRepository examAttemptRepository,
            AchievementService achievementService,
            CourseCertificateRepository certificateRepository
    ) {
        this.accessService = accessService;
        this.activityRepository = activityRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.taskAttemptRepository = taskAttemptRepository;
        this.examAttemptRepository = examAttemptRepository;
        this.achievementService = achievementService;
        this.certificateRepository = certificateRepository;
    }

    @Transactional(readOnly = true)
    public LearningAnalyticsDto get(Authentication authentication) {
        User user = accessService.currentUser(authentication);
        long attemptedTasks = taskAttemptRepository.countByUserId(user.getId());
        long correctTasks = taskAttemptRepository.countByUserIdAndCorrectTrue(user.getId());
        int taskAccuracy = attemptedTasks == 0
                ? 0
                : (int) Math.round(correctTasks * 100.0 / attemptedTasks);
        long completedExams = examAttemptRepository.countByUserIdAndStatus(
                user.getId(),
                ExamAttemptStatus.SUBMITTED
        );

        return new LearningAnalyticsDto(
                activityRepository.sumTotalSecondsByUserId(user.getId()),
                lessonProgressRepository.countByUserIdAndCompletedTrue(user.getId()),
                achievementService.countCompletedModules(user.getId()),
                attemptedTasks,
                correctTasks,
                taskAccuracy,
                completedExams,
                (int) Math.round(examAttemptRepository.averagePercentageByUserId(user.getId())),
                taskAttemptRepository.findTop5ByUserIdOrderByAttemptCountDesc(user.getId()).stream()
                        .map(this::hardTask)
                        .toList(),
                activityRepository.findTop14ByUserIdOrderByActivityDateDesc(user.getId()).stream()
                        .sorted(Comparator.comparing(StudyActivity::getActivityDate))
                        .map(activity -> new LearningAnalyticsDto.DailyActivityDto(
                                activity.getActivityDate(),
                                activity.getTotalSeconds()
                        ))
                        .toList(),
                achievementService.getFor(user),
                certificateRepository.findByUserIdOrderByIssuedAtDesc(user.getId()).stream()
                        .map(com.twojlogin.lms.dto.CertificateDto::from)
                        .toList()
        );
    }

    private LearningAnalyticsDto.HardTaskDto hardTask(TaskAttempt attempt) {
        String title = attempt.getBlock().getTitle();
        if (title == null || title.isBlank()) title = "Zadanie #" + attempt.getBlock().getId();
        return new LearningAnalyticsDto.HardTaskDto(
                attempt.getBlock().getId(),
                title,
                attempt.getBlock().getLesson().getTitle(),
                attempt.getAttemptCount(),
                attempt.isCorrect()
        );
    }
}

package com.twojlogin.lms.service;

import com.twojlogin.lms.entity.*;
import com.twojlogin.lms.repository.LessonRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProgressRewardService {

    private final LessonRepository lessonRepository;
    private final CertificateService certificateService;
    private final AchievementService achievementService;
    private final NotificationService notificationService;
    private final GamificationService gamificationService;

    public ProgressRewardService(
            LessonRepository lessonRepository,
            CertificateService certificateService,
            AchievementService achievementService,
            NotificationService notificationService,
            GamificationService gamificationService
    ) {
        this.lessonRepository = lessonRepository;
        this.certificateService = certificateService;
        this.achievementService = achievementService;
        this.notificationService = notificationService;
        this.gamificationService = gamificationService;
    }

    @Transactional
    public void afterLessonCompleted(User user, Lesson lesson) {
        gamificationService.awardLessonCompletion(user);

        lessonRepository
                .findFirstByModuleIdAndOrderIndexGreaterThanOrderByOrderIndexAsc(
                        lesson.getModule().getId(),
                        lesson.getOrderIndex()
                )
                .ifPresent(nextLesson -> notificationService.create(
                        user,
                        NotificationType.LESSON_UNLOCKED,
                        "Nowa lekcja odblokowana",
                        "Możesz rozpocząć lekcję „" + nextLesson.getTitle() + "”.",
                        "/lesson/" + nextLesson.getId()
                ));

        certificateService.issueIfEligible(user, lesson.getModule().getCourse());
        achievementService.evaluate(user);
    }
}

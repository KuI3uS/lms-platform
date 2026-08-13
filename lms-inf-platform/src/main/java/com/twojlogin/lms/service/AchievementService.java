package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.AchievementDto;
import com.twojlogin.lms.entity.AchievementType;
import com.twojlogin.lms.entity.ExamAttemptStatus;
import com.twojlogin.lms.entity.NotificationType;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.entity.UserAchievement;
import com.twojlogin.lms.repository.CourseCertificateRepository;
import com.twojlogin.lms.repository.CourseModuleRepository;
import com.twojlogin.lms.repository.ExamAttemptRepository;
import com.twojlogin.lms.repository.LessonProgressRepository;
import com.twojlogin.lms.repository.StudyActivityRepository;
import com.twojlogin.lms.repository.TaskAttemptRepository;
import com.twojlogin.lms.repository.UserAchievementRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AchievementService {

    private static final ZoneId WARSAW_ZONE = ZoneId.of("Europe/Warsaw");

    private final UserAchievementRepository achievementRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final CourseModuleRepository moduleRepository;
    private final CourseCertificateRepository certificateRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final TaskAttemptRepository taskAttemptRepository;
    private final StudyActivityRepository activityRepository;
    private final CourseAccessService accessService;
    private final NotificationService notificationService;
    private final GamificationService gamificationService;

    public AchievementService(
            UserAchievementRepository achievementRepository,
            LessonProgressRepository lessonProgressRepository,
            CourseModuleRepository moduleRepository,
            CourseCertificateRepository certificateRepository,
            ExamAttemptRepository examAttemptRepository,
            TaskAttemptRepository taskAttemptRepository,
            StudyActivityRepository activityRepository,
            CourseAccessService accessService,
            NotificationService notificationService,
            GamificationService gamificationService
    ) {
        this.achievementRepository = achievementRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.moduleRepository = moduleRepository;
        this.certificateRepository = certificateRepository;
        this.examAttemptRepository = examAttemptRepository;
        this.taskAttemptRepository = taskAttemptRepository;
        this.activityRepository = activityRepository;
        this.accessService = accessService;
        this.notificationService = notificationService;
        this.gamificationService = gamificationService;
    }

    @Transactional
    public List<AchievementDto> getAndEvaluate(Authentication authentication) {
        return evaluate(accessService.currentUser(authentication));
    }

    @Transactional
    public List<AchievementDto> evaluate(User user) {
        AchievementMetrics metrics = metricsFor(user);
        Map<AchievementType, UserAchievement> unlocked = unlockedFor(user);

        for (AchievementType type : AchievementType.values()) {
            if (progressFor(type, metrics) >= type.target()) {
                unlockOrReward(user, unlocked, type);
            }
        }

        return Arrays.stream(AchievementType.values())
                .map(type -> toDto(
                        type,
                        unlocked.get(type),
                        progressFor(type, metrics)
                ))
                .toList();
    }

    @Transactional
    public List<AchievementDto> getFor(User user) {
        return evaluate(user);
    }

    public long countCompletedModules(Long userId) {
        return moduleRepository.countCompletedModulesByUserId(userId);
    }

    private AchievementMetrics metricsFor(User user) {
        GamificationService.GamificationSnapshot gamification =
                gamificationService.snapshot(user);
        long completedLessons = lessonProgressRepository
                .countByUserIdAndCompletedTrue(user.getId());
        int learningDayStreak = LearningStatsService.calculateStreak(
                lessonProgressRepository.findCompletedDatesByUserId(user.getId()),
                LocalDate.now(WARSAW_ZONE)
        );
        long submittedExams = examAttemptRepository.countByUserIdAndStatus(
                user.getId(),
                ExamAttemptStatus.SUBMITTED
        );
        boolean perfectExam = examAttemptRepository
                .existsByUserIdAndStatusAndPercentageGreaterThanEqual(
                        user.getId(),
                        ExamAttemptStatus.SUBMITTED,
                        100
                );

        return new AchievementMetrics(
                completedLessons,
                learningDayStreak,
                gamification.xp(),
                taskAttemptRepository.countByUserIdAndCorrectTrue(user.getId()),
                gamification.bestTaskStreak(),
                countCompletedModules(user.getId()),
                certificateRepository.countByUserId(user.getId()),
                submittedExams,
                perfectExam,
                activityRepository.sumTotalSecondsByUserId(user.getId()),
                gamification.level()
        );
    }

    private void unlockOrReward(
            User user,
            Map<AchievementType, UserAchievement> unlocked,
            AchievementType type
    ) {
        UserAchievement achievement = unlocked.get(type);
        boolean newlyUnlocked = achievement == null;

        if (newlyUnlocked) {
            achievement = new UserAchievement();
            achievement.setUser(user);
            achievement.setType(type);
            achievement.setUnlockedAt(LocalDateTime.now(WARSAW_ZONE));
            achievement = achievementRepository.saveAndFlush(achievement);
            unlocked.put(type, achievement);
        }

        if (achievement.isRewardClaimed()) return;

        gamificationService.awardAchievementGems(user, type.gemReward());
        achievement.setRewardClaimed(true);
        achievementRepository.save(achievement);

        notificationService.create(
                user,
                NotificationType.ACHIEVEMENT,
                newlyUnlocked ? "Nowe osiągnięcie" : "Odebrano zaległą nagrodę",
                "„" + type.title() + "” — otrzymujesz +"
                        + type.gemReward() + " klejnotów.",
                "/learning-center"
        );
    }

    private Map<AchievementType, UserAchievement> unlockedFor(User user) {
        return achievementRepository
                .findByUserIdOrderByUnlockedAtAsc(user.getId())
                .stream()
                .collect(Collectors.toMap(
                        UserAchievement::getType,
                        achievement -> achievement,
                        (first, ignored) -> first,
                        () -> new EnumMap<>(AchievementType.class)
                ));
    }

    private AchievementDto toDto(
            AchievementType type,
            UserAchievement unlocked,
            long progress
    ) {
        return new AchievementDto(
                type,
                type.title(),
                type.description(),
                type.icon(),
                type.gemReward(),
                Math.min(progress, type.target()),
                type.target(),
                unlocked != null,
                unlocked == null ? null : unlocked.getUnlockedAt()
        );
    }

    private long progressFor(AchievementType type, AchievementMetrics metrics) {
        return switch (type) {
            case FIRST_LESSON, LESSONS_5, LESSONS_10, LESSONS_25,
                    LESSONS_50, LESSONS_100 -> metrics.completedLessons();
            case STREAK_3, STREAK_7, STREAK_14, STREAK_30 ->
                    metrics.learningDayStreak();
            case TASKS_10, TASKS_50, TASKS_100, TASKS_250, TASKS_500 ->
                    metrics.correctTasks();
            case COMBO_10, COMBO_25 -> metrics.bestTaskStreak();
            case XP_100, XP_500, XP_1000, XP_5000 -> metrics.xp();
            case LEVEL_10, LEVEL_50, PRISM_LEAGUE, MYTHIC_LEAGUE ->
                    metrics.level();
            case MODULE_MASTER, MODULES_5, MODULES_10 -> metrics.completedModules();
            case COURSE_GRADUATE, COURSES_3 -> metrics.completedCourses();
            case PERFECT_EXAM -> metrics.perfectExam() ? 1 : 0;
            case EXAMS_10 -> metrics.completedExams();
            case STUDY_HOUR, STUDY_10_HOURS, STUDY_25_HOURS, STUDY_50_HOURS ->
                    metrics.studySeconds();
        };
    }

    private record AchievementMetrics(
            long completedLessons,
            int learningDayStreak,
            long xp,
            long correctTasks,
            int bestTaskStreak,
            long completedModules,
            long completedCourses,
            long completedExams,
            boolean perfectExam,
            long studySeconds,
            int level
    ) {
    }
}

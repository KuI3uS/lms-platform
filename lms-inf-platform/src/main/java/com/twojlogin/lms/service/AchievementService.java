package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.AchievementDto;
import com.twojlogin.lms.entity.*;
import com.twojlogin.lms.repository.*;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.function.BooleanSupplier;
import java.util.stream.Collectors;

@Service
public class AchievementService {

    private static final int XP_PER_LESSON = 20;
    private static final ZoneId WARSAW_ZONE = ZoneId.of("Europe/Warsaw");

    private final UserAchievementRepository achievementRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final CourseModuleRepository moduleRepository;
    private final CourseCertificateRepository certificateRepository;
    private final ExamAttemptRepository examAttemptRepository;
    private final CourseAccessService accessService;
    private final NotificationService notificationService;

    public AchievementService(
            UserAchievementRepository achievementRepository,
            LessonProgressRepository lessonProgressRepository,
            CourseModuleRepository moduleRepository,
            CourseCertificateRepository certificateRepository,
            ExamAttemptRepository examAttemptRepository,
            CourseAccessService accessService,
            NotificationService notificationService
    ) {
        this.achievementRepository = achievementRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.moduleRepository = moduleRepository;
        this.certificateRepository = certificateRepository;
        this.examAttemptRepository = examAttemptRepository;
        this.accessService = accessService;
        this.notificationService = notificationService;
    }

    @Transactional
    public List<AchievementDto> getAndEvaluate(Authentication authentication) {
        return evaluate(accessService.currentUser(authentication));
    }

    @Transactional
    public List<AchievementDto> evaluate(User user) {
        Map<AchievementType, UserAchievement> unlocked = unlockedFor(user);
        long completedLessons = lessonProgressRepository
                .countByUserIdAndCompletedTrue(user.getId());
        int xp = Math.toIntExact(completedLessons * XP_PER_LESSON);
        int streak = LearningStatsService.calculateStreak(
                lessonProgressRepository.findCompletedDatesByUserId(user.getId()),
                LocalDate.now(WARSAW_ZONE)
        );
        long completedModules = countCompletedModules(user.getId());

        unlockWhen(user, unlocked, AchievementType.FIRST_LESSON, () -> completedLessons >= 1);
        unlockWhen(user, unlocked, AchievementType.STREAK_3, () -> streak >= 3);
        unlockWhen(user, unlocked, AchievementType.STREAK_7, () -> streak >= 7);
        unlockWhen(user, unlocked, AchievementType.XP_100, () -> xp >= 100);
        unlockWhen(user, unlocked, AchievementType.XP_500, () -> xp >= 500);
        unlockWhen(user, unlocked, AchievementType.MODULE_MASTER, () -> completedModules >= 1);
        unlockWhen(
                user,
                unlocked,
                AchievementType.COURSE_GRADUATE,
                () -> certificateRepository.countByUserId(user.getId()) >= 1
        );
        unlockWhen(
                user,
                unlocked,
                AchievementType.PERFECT_EXAM,
                () -> examAttemptRepository.existsByUserIdAndStatusAndPercentageGreaterThanEqual(
                        user.getId(),
                        ExamAttemptStatus.SUBMITTED,
                        100
                )
        );

        return Arrays.stream(AchievementType.values())
                .map(type -> toDto(type, unlocked.get(type)))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AchievementDto> getFor(User user) {
        Map<AchievementType, UserAchievement> unlocked = unlockedFor(user);
        return Arrays.stream(AchievementType.values())
                .map(type -> toDto(type, unlocked.get(type)))
                .toList();
    }

    public long countCompletedModules(Long userId) {
        return moduleRepository.countCompletedModulesByUserId(userId);
    }

    private void unlockWhen(
            User user,
            Map<AchievementType, UserAchievement> unlocked,
            AchievementType type,
            BooleanSupplier condition
    ) {
        if (unlocked.containsKey(type) || !condition.getAsBoolean()) {
            return;
        }

        UserAchievement achievement = new UserAchievement();
        achievement.setUser(user);
        achievement.setType(type);
        achievement.setUnlockedAt(LocalDateTime.now());
        UserAchievement saved = achievementRepository.save(achievement);
        unlocked.put(type, saved);

        AchievementDto definition = toDto(type, saved);
        notificationService.create(
                user,
                NotificationType.ACHIEVEMENT,
                "Nowe osiągnięcie",
                "Zdobyłeś osiągnięcie „" + definition.title() + "”.",
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
            UserAchievement unlocked
    ) {
        return switch (type) {
            case FIRST_LESSON -> dto(type, "Pierwszy krok", "Ukończ pierwszą lekcję", "book", unlocked);
            case STREAK_3 -> dto(type, "Dobry rytm", "Utrzymaj serię przez 3 dni", "fire", unlocked);
            case STREAK_7 -> dto(type, "Tydzień nauki", "Utrzymaj serię przez 7 dni", "calendar", unlocked);
            case XP_100 -> dto(type, "100 XP", "Zdobądź 100 punktów doświadczenia", "lightning", unlocked);
            case XP_500 -> dto(type, "500 XP", "Zdobądź 500 punktów doświadczenia", "stars", unlocked);
            case MODULE_MASTER -> dto(type, "Mistrz modułu", "Ukończ wszystkie lekcje w module", "layers", unlocked);
            case COURSE_GRADUATE -> dto(type, "Absolwent EduHub", "Ukończ cały kurs", "certificate", unlocked);
            case PERFECT_EXAM -> dto(type, "Perfekcyjny wynik", "Zdobądź 100% z egzaminu", "trophy", unlocked);
        };
    }

    private AchievementDto dto(
            AchievementType type,
            String title,
            String description,
            String icon,
            UserAchievement unlocked
    ) {
        return new AchievementDto(
                type,
                title,
                description,
                icon,
                unlocked != null,
                unlocked == null ? null : unlocked.getUnlockedAt()
        );
    }
}

package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.LearningStatsDto;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.LessonProgressRepository;
import com.twojlogin.lms.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class LearningStatsService {

    private static final ZoneId WARSAW_ZONE = ZoneId.of("Europe/Warsaw");

    private final UserRepository userRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final GamificationService gamificationService;

    public LearningStatsService(
            UserRepository userRepository,
            LessonProgressRepository lessonProgressRepository,
            GamificationService gamificationService
    ) {
        this.userRepository = userRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.gamificationService = gamificationService;
    }

    public LearningStatsDto getFor(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        long completedLessons = lessonProgressRepository.countByUserIdAndCompletedTrue(user.getId());
        List<LocalDateTime> completedDates = lessonProgressRepository.findCompletedDatesByUserId(user.getId());

        int streakDays = calculateStreak(completedDates, LocalDate.now(WARSAW_ZONE));
        GamificationService.GamificationSnapshot stats =
                gamificationService.snapshot(user);

        return new LearningStatsDto(
                stats.xp(),
                stats.level(),
                stats.levelStartXp(),
                stats.nextLevelXp(),
                stats.xpIntoLevel(),
                stats.xpForNextLevel(),
                streakDays,
                stats.taskStreak(),
                stats.bestTaskStreak(),
                stats.xpMultiplier(),
                stats.taskStreakExpiresAt(),
                completedLessons,
                stats.gemBalance(),
                stats.totalGemsEarned(),
                stats.nextGemRewardLevel(),
                stats.nextGemRewardAmount(),
                stats.voucher5Count(),
                stats.voucher10Count(),
                stats.voucher20Count(),
                stats.xpBoostPercent(),
                stats.xpBoostExpiresAt(),
                stats.leagueName(),
                stats.leagueColor(),
                stats.nextLeagueLevel()
        );
    }

    static int calculateStreak(List<LocalDateTime> activityDates, LocalDate today) {
        Set<LocalDate> activeDays = new HashSet<>();
        activityDates.stream().map(LocalDateTime::toLocalDate).forEach(activeDays::add);

        LocalDate cursor = activeDays.contains(today) ? today : today.minusDays(1);
        if (!activeDays.contains(cursor)) return 0;

        int streak = 0;
        while (activeDays.contains(cursor)) {
            streak++;
            cursor = cursor.minusDays(1);
        }
        return streak;
    }
}

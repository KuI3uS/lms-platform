package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.LearningStatsDto;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.LessonProgressRepository;
import com.twojlogin.lms.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class LearningStatsService {

    private static final int XP_PER_COMPLETED_LESSON = 20;

    private final UserRepository userRepository;
    private final LessonProgressRepository lessonProgressRepository;

    public LearningStatsService(
            UserRepository userRepository,
            LessonProgressRepository lessonProgressRepository
    ) {
        this.userRepository = userRepository;
        this.lessonProgressRepository = lessonProgressRepository;
    }

    public LearningStatsDto getFor(Authentication authentication) {
        User user = userRepository.findByEmail(authentication.getName()).orElseThrow();
        long completedLessons = lessonProgressRepository.countByUserIdAndCompletedTrue(user.getId());
        List<LocalDateTime> completedDates = lessonProgressRepository.findCompletedDatesByUserId(user.getId());

        int xp = Math.toIntExact(completedLessons * XP_PER_COMPLETED_LESSON);
        int streakDays = calculateStreak(completedDates, LocalDate.now());

        return new LearningStatsDto(xp, streakDays, completedLessons);
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

package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.AchievementDto;
import com.twojlogin.lms.entity.AchievementType;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.entity.UserAchievement;
import com.twojlogin.lms.repository.CourseCertificateRepository;
import com.twojlogin.lms.repository.CourseModuleRepository;
import com.twojlogin.lms.repository.ExamAttemptRepository;
import com.twojlogin.lms.repository.LessonProgressRepository;
import com.twojlogin.lms.repository.StudyActivityRepository;
import com.twojlogin.lms.repository.TaskAttemptRepository;
import com.twojlogin.lms.repository.UserAchievementRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AchievementServiceTest {

    private AchievementService service;
    private GamificationService gamificationService;
    private UserAchievementRepository achievementRepository;
    private LessonProgressRepository lessonProgressRepository;
    private final List<UserAchievement> achievements = new ArrayList<>();
    private User user;

    @BeforeEach
    void setUp() {
        achievementRepository = mock(UserAchievementRepository.class);
        lessonProgressRepository = mock(LessonProgressRepository.class);
        CourseModuleRepository moduleRepository = mock(CourseModuleRepository.class);
        CourseCertificateRepository certificateRepository = mock(CourseCertificateRepository.class);
        ExamAttemptRepository examAttemptRepository = mock(ExamAttemptRepository.class);
        TaskAttemptRepository taskAttemptRepository = mock(TaskAttemptRepository.class);
        StudyActivityRepository activityRepository = mock(StudyActivityRepository.class);
        CourseAccessService accessService = mock(CourseAccessService.class);
        NotificationService notificationService = mock(NotificationService.class);
        gamificationService = mock(GamificationService.class);

        user = new User();
        user.setId(7L);

        when(achievementRepository.findByUserIdOrderByUnlockedAtAsc(user.getId()))
                .thenAnswer(ignored -> new ArrayList<>(achievements));
        when(achievementRepository.saveAndFlush(any(UserAchievement.class)))
                .thenAnswer(invocation -> {
                    UserAchievement saved = invocation.getArgument(0);
                    achievements.add(saved);
                    return saved;
                });
        when(achievementRepository.save(any(UserAchievement.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(lessonProgressRepository.findCompletedDatesByUserId(user.getId()))
                .thenReturn(List.of());
        when(gamificationService.snapshot(user)).thenReturn(snapshot());

        service = new AchievementService(
                achievementRepository,
                lessonProgressRepository,
                moduleRepository,
                certificateRepository,
                examAttemptRepository,
                taskAttemptRepository,
                activityRepository,
                accessService,
                notificationService,
                gamificationService
        );
    }

    @Test
    void awardsGemsOnlyOnceForAnUnlockedAchievement() {
        when(lessonProgressRepository.countByUserIdAndCompletedTrue(user.getId()))
                .thenReturn(1L);

        List<AchievementDto> first = service.evaluate(user);
        service.evaluate(user);

        AchievementDto firstLesson = first.stream()
                .filter(item -> item.type() == AchievementType.FIRST_LESSON)
                .findFirst()
                .orElseThrow();
        assertTrue(firstLesson.unlocked());
        assertEquals(25, firstLesson.gemReward());
        verify(gamificationService, times(1)).awardAchievementGems(user, 25);
    }

    @Test
    void grantsAOneTimeRetroactiveRewardForOldAchievements() {
        UserAchievement oldAchievement = new UserAchievement();
        oldAchievement.setUser(user);
        oldAchievement.setType(AchievementType.FIRST_LESSON);
        achievements.add(oldAchievement);
        when(lessonProgressRepository.countByUserIdAndCompletedTrue(user.getId()))
                .thenReturn(1L);

        service.evaluate(user);
        service.evaluate(user);

        assertTrue(oldAchievement.isRewardClaimed());
        verify(gamificationService, times(1)).awardAchievementGems(user, 25);
    }

    private GamificationService.GamificationSnapshot snapshot() {
        return new GamificationService.GamificationSnapshot(
                0, 1, 0, 100, 0, 100,
                0, 0, 1, null,
                0, 0, 5, 250,
                0, 0, 0, 0, null,
                "Miedź", "#fb923c", 11
        );
    }
}

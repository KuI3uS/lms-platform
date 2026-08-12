package com.twojlogin.lms.service;

import com.twojlogin.lms.entity.GamificationProfile;
import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.entity.TaskAttempt;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.GamificationProfileRepository;
import com.twojlogin.lms.repository.LessonProgressRepository;
import com.twojlogin.lms.repository.TaskAttemptRepository;
import com.twojlogin.lms.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class GamificationServiceTest {

    private GamificationProfileRepository profileRepository;
    private GamificationService service;
    private User user;
    private GamificationProfile profile;
    private final Instant now = Instant.parse("2026-08-11T10:00:00Z");

    @BeforeEach
    void setUp() {
        profileRepository = mock(GamificationProfileRepository.class);
        LessonProgressRepository progressRepository =
                mock(LessonProgressRepository.class);
        TaskAttemptRepository attemptRepository =
                mock(TaskAttemptRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        NotificationService notificationService =
                mock(NotificationService.class);

        service = new GamificationService(
                profileRepository,
                progressRepository,
                attemptRepository,
                userRepository,
                notificationService,
                Clock.fixed(now, ZoneId.of("Europe/Warsaw"))
        );

        user = new User();
        user.setId(7L);
        profile = new GamificationProfile();
        profile.setUser(user);
        profile.setLevel(1);
        profile.setDiscountBalance(BigDecimal.ZERO.setScale(2));
        profile.setGemEconomyInitialized(true);

        when(profileRepository.findByUserIdForUpdate(user.getId()))
                .thenReturn(Optional.of(profile));
        when(profileRepository.save(any(GamificationProfile.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void appliesX2AfterFiveTasksAndNeverAwardsTheSameTaskTwice() {
        profile.setCorrectTaskStreak(4);
        profile.setCorrectTaskStreakUpdatedAt(now.minusSeconds(60));
        LessonBlock block = new LessonBlock();
        block.setPoints(10);
        TaskAttempt attempt = new TaskAttempt();

        GamificationService.AwardResult first = service.recordTaskResult(
                profile,
                block,
                attempt,
                false,
                true
        );
        GamificationService.AwardResult repeated = service.recordTaskResult(
                profile,
                block,
                attempt,
                true,
                true
        );

        assertEquals(20, first.xpEarned());
        assertEquals(2, first.multiplier());
        assertEquals(5, first.taskStreak());
        assertEquals(0, repeated.xpEarned());
        assertEquals(20, profile.getTotalXp());
    }

    @Test
    void expiresTaskStreakExactlyAfterTwentyFourHours() {
        profile.setCorrectTaskStreak(4);
        profile.setCorrectTaskStreakUpdatedAt(
                now.minus(GamificationService.TASK_STREAK_TTL)
        );
        LessonBlock block = new LessonBlock();
        block.setPoints(10);

        GamificationService.AwardResult result = service.recordTaskResult(
                profile,
                block,
                new TaskAttempt(),
                false,
                true
        );

        assertEquals(1, result.taskStreak());
        assertEquals(1, result.multiplier());
        assertEquals(now, profile.getCorrectTaskStreakUpdatedAt());
    }

    @Test
    void legacyStreakWithoutTimestampIsTreatedAsExpired() {
        profile.setCorrectTaskStreak(8);

        GamificationService.GamificationSnapshot snapshot = service.snapshot(user);

        assertEquals(0, snapshot.taskStreak());
        assertEquals(1, snapshot.xpMultiplier());
        assertEquals(null, snapshot.taskStreakExpiresAt());
    }

    @Test
    void capsMultiplierAtThree() {
        assertEquals(1, GamificationService.multiplierFor(4));
        assertEquals(2, GamificationService.multiplierFor(5));
        assertEquals(3, GamificationService.multiplierFor(10));
        assertEquals(3, GamificationService.multiplierFor(100));
    }

    @Test
    void grantsTwoHundredFiftyGemsAtEveryFifthLevel() {
        profile.setTotalXp(GamificationService.xpRequiredForLevel(10) - 10);
        profile.setLevel(9);
        profile.setRewardedGemLevel(5);
        LessonBlock block = new LessonBlock();
        block.setPoints(10);

        GamificationService.AwardResult result = service.recordTaskResult(
                profile,
                block,
                new TaskAttempt(),
                false,
                true
        );

        assertEquals(10, result.level());
        assertTrue(result.levelUp());
        assertEquals(250, profile.getGemBalance());
        assertEquals(10, profile.getRewardedGemLevel());
    }

    @Test
    void consumesTwentyPercentVoucherAndKeepsCourseAboveMinimumPrice() {
        profile.setVoucher20Count(1);

        BigDecimal discount = service.reserveVoucher(
                user,
                new BigDecimal("1000.00"),
                20
        );

        assertEquals(new BigDecimal("200.00"), discount);
        assertEquals(0, profile.getVoucher20Count());
    }

    @Test
    void completedLessonAwardsFiftyGemsOnlyWhenCalledForFirstCompletion() {
        GamificationService.AwardResult result = service.awardLessonCompletion(user);

        assertEquals(50, result.gemsEarned());
        assertEquals(50, result.gemBalance());
        assertEquals(50, profile.getTotalGemsEarned());
    }

    @Test
    void higherLevelsRequireMoreXp() {
        long levelTwoCost = GamificationService.xpRequiredForLevel(2);
        long levelTenStep = GamificationService.xpRequiredForLevel(11)
                - GamificationService.xpRequiredForLevel(10);
        long levelTwentyStep = GamificationService.xpRequiredForLevel(21)
                - GamificationService.xpRequiredForLevel(20);

        assertTrue(levelTenStep > levelTwoCost);
        assertTrue(levelTwentyStep > levelTenStep);
    }
}

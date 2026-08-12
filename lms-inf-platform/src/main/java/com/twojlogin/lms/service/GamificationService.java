package com.twojlogin.lms.service;

import com.twojlogin.lms.entity.GamificationProfile;
import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.entity.NotificationType;
import com.twojlogin.lms.entity.TaskAttempt;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.GamificationProfileRepository;
import com.twojlogin.lms.repository.LessonProgressRepository;
import com.twojlogin.lms.repository.TaskAttemptRepository;
import com.twojlogin.lms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;

@Service
public class GamificationService {

    public static final int LESSON_COMPLETION_XP = 20;
    public static final int GEMS_PER_COMPLETED_LESSON = 50;
    public static final int GEMS_PER_LEVEL_MILESTONE = 250;
    public static final int GEM_LEVEL_INTERVAL = 5;
    public static final BigDecimal MINIMUM_PAYABLE_RATE = new BigDecimal("0.25");
    public static final Duration TASK_STREAK_TTL = Duration.ofHours(24);
    private static final ZoneId WARSAW_ZONE = ZoneId.of("Europe/Warsaw");

    private final GamificationProfileRepository profileRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final TaskAttemptRepository taskAttemptRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final Clock clock;

    @Autowired
    public GamificationService(
            GamificationProfileRepository profileRepository,
            LessonProgressRepository lessonProgressRepository,
            TaskAttemptRepository taskAttemptRepository,
            UserRepository userRepository,
            NotificationService notificationService
    ) {
        this(
                profileRepository,
                lessonProgressRepository,
                taskAttemptRepository,
                userRepository,
                notificationService,
                Clock.system(WARSAW_ZONE)
        );
    }

    GamificationService(
            GamificationProfileRepository profileRepository,
            LessonProgressRepository lessonProgressRepository,
            TaskAttemptRepository taskAttemptRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            Clock clock
    ) {
        this.profileRepository = profileRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.taskAttemptRepository = taskAttemptRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.clock = clock;
    }

    @Transactional
    public GamificationProfile profileForUpdate(User user) {
        GamificationProfile profile = profileRepository.findByUserIdForUpdate(user.getId())
                .orElseGet(() -> {
                    User lockedUser = userRepository.findByIdForUpdate(user.getId())
                            .orElseThrow();
                    return profileRepository.findByUserIdForUpdate(user.getId())
                            .orElseGet(() -> initializeProfile(lockedUser));
                });
        initializeGemEconomy(profile);
        expireBoostIfNeeded(profile);
        return profile;
    }

    @Transactional
    public AwardResult recordTaskResult(
            GamificationProfile profile,
            LessonBlock block,
            TaskAttempt attempt,
            boolean previouslyCorrect,
            boolean correct
    ) {
        if (previouslyCorrect || attempt.getXpAwarded() > 0) {
            return currentResult(profile, 0, false, 0);
        }

        if (!correct) {
            profile.setCorrectTaskStreak(0);
            profile.setCorrectTaskStreakUpdatedAt(null);
            profileRepository.save(profile);
            return currentResult(profile, 0, false, 0);
        }

        Instant now = clock.instant();
        int streak = effectiveTaskStreak(profile, now) + 1;
        int multiplier = multiplierFor(streak);
        int baseXp = block.getPoints() == null || block.getPoints() <= 0
                ? 10
                : Math.min(block.getPoints(), 1000);
        int awardedXp = applyXpBoost(profile, baseXp * multiplier);
        int previousLevel = profile.getLevel();

        profile.setCorrectTaskStreak(streak);
        profile.setCorrectTaskStreakUpdatedAt(now);
        profile.setBestCorrectTaskStreak(Math.max(
                profile.getBestCorrectTaskStreak(),
                streak
        ));
        attempt.setXpAwarded(awardedXp);
        addXp(profile, awardedXp, true);

        return currentResult(profile, awardedXp, profile.getLevel() > previousLevel, 0);
    }

    @Transactional
    public AwardResult awardLessonCompletion(User user) {
        GamificationProfile profile = profileForUpdate(user);
        int previousLevel = profile.getLevel();
        int awardedXp = applyXpBoost(profile, LESSON_COMPLETION_XP);
        addGems(profile, GEMS_PER_COMPLETED_LESSON);
        addXp(profile, awardedXp, true);
        return currentResult(
                profile,
                awardedXp,
                profile.getLevel() > previousLevel,
                GEMS_PER_COMPLETED_LESSON
        );
    }

    @Transactional
    public GamificationSnapshot snapshot(User user) {
        GamificationProfile profile = profileForUpdate(user);
        return snapshot(profile);
    }

    @Transactional
    public BigDecimal reserveVoucher(
            User user,
            BigDecimal coursePrice,
            Integer discountPercent
    ) {
        if (discountPercent == null || discountPercent == 0) {
            return BigDecimal.ZERO.setScale(2);
        }
        if (coursePrice == null || coursePrice.signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kuponu nie można użyć do bezpłatnego kursu");
        }
        if (discountPercent != 5 && discountPercent != 10 && discountPercent != 20) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nieprawidłowy kupon zniżkowy");
        }

        GamificationProfile profile = profileForUpdate(user);
        decrementVoucher(profile, discountPercent);
        BigDecimal discount = coursePrice
                .multiply(BigDecimal.valueOf(discountPercent))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal maximumDiscount = coursePrice
                .multiply(BigDecimal.ONE.subtract(MINIMUM_PAYABLE_RATE))
                .setScale(2, RoundingMode.DOWN);
        discount = discount.min(maximumDiscount);
        profileRepository.save(profile);
        return discount;
    }

    @Transactional
    public void refundVoucher(User user, Integer discountPercent) {
        if (discountPercent == null || discountPercent == 0) return;
        GamificationProfile profile = profileForUpdate(user);
        incrementVoucher(profile, discountPercent);
        profileRepository.save(profile);
    }

    public static int multiplierFor(int correctTaskStreak) {
        if (correctTaskStreak >= 10) return 3;
        if (correctTaskStreak >= 5) return 2;
        return 1;
    }

    public static long xpRequiredForLevel(int targetLevel) {
        if (targetLevel <= 1) return 0;
        long total = 0;
        for (int level = 1; level < targetLevel; level++) {
            long completedLevels = level - 1L;
            long advancedLevel = Math.max(0, level - 20L);
            total += 100L
                    + completedLevels * 25L
                    + advancedLevel * advancedLevel * 20L;
        }
        return total;
    }

    public static int levelForXp(long xp) {
        int level = 1;
        while (level < 1000 && xp >= xpRequiredForLevel(level + 1)) {
            level++;
        }
        return level;
    }

    private GamificationProfile initializeProfile(User user) {
        long completedLessons = lessonProgressRepository
                .countByUserIdAndCompletedTrue(user.getId());
        long historicalLessonXp = completedLessons * LESSON_COMPLETION_XP;
        long historicalTaskXp = taskAttemptRepository
                .sumHistoricalBaseXpByUserId(user.getId());

        GamificationProfile profile = new GamificationProfile();
        profile.setUser(user);
        profile.setTotalXp(historicalLessonXp + historicalTaskXp);
        profile.setLevel(levelForXp(profile.getTotalXp()));
        profile.setDiscountBalance(BigDecimal.ZERO.setScale(2));
        profile.setGemBalance(completedLessons * GEMS_PER_COMPLETED_LESSON);
        profile.setTotalGemsEarned(profile.getGemBalance());
        profile.setGemEconomyInitialized(true);
        synchronizeGemMilestones(profile, false);
        return profileRepository.saveAndFlush(profile);
    }

    private void initializeGemEconomy(GamificationProfile profile) {
        if (profile.isGemEconomyInitialized()) return;
        long completedLessons = lessonProgressRepository
                .countByUserIdAndCompletedTrue(profile.getUser().getId());
        long retroactiveLessonGems = completedLessons * GEMS_PER_COMPLETED_LESSON;
        profile.setGemBalance(profile.getGemBalance() + retroactiveLessonGems);
        profile.setTotalGemsEarned(profile.getTotalGemsEarned() + retroactiveLessonGems);
        profile.setDiscountBalance(BigDecimal.ZERO.setScale(2));
        profile.setGemEconomyInitialized(true);
        synchronizeGemMilestones(profile, false);
        profileRepository.save(profile);
    }

    private void addXp(GamificationProfile profile, int amount, boolean notify) {
        int previousLevel = profile.getLevel();
        profile.setTotalXp(Math.max(0, profile.getTotalXp() + amount));
        profile.setLevel(levelForXp(profile.getTotalXp()));
        synchronizeGemMilestones(profile, notify);
        profileRepository.save(profile);

        if (notify && profile.getLevel() > previousLevel) {
            LearningLeague league = LearningLeague.forLevel(profile.getLevel());
            notificationService.create(
                    profile.getUser(),
                    NotificationType.ACHIEVEMENT,
                    "Nowy poziom: " + profile.getLevel(),
                    "Awansujesz w lidze „" + league.displayName() + "” i masz "
                            + profile.getTotalXp() + " XP.",
                    "/learning-center"
            );
        }
    }

    private void synchronizeGemMilestones(GamificationProfile profile, boolean notify) {
        int targetRewardedLevel = profile.getLevel() / GEM_LEVEL_INTERVAL * GEM_LEVEL_INTERVAL;
        int previousRewardedLevel = profile.getRewardedGemLevel();
        int newMilestones = (targetRewardedLevel - previousRewardedLevel) / GEM_LEVEL_INTERVAL;
        if (newMilestones <= 0) return;

        long reward = (long) newMilestones * GEMS_PER_LEVEL_MILESTONE;
        addGems(profile, reward);
        profile.setRewardedGemLevel(targetRewardedLevel);
        if (notify) {
            notificationService.create(
                    profile.getUser(),
                    NotificationType.ACHIEVEMENT,
                    "Premia ligowa: +" + reward + " klejnotów",
                    "Za osiągnięcie poziomu " + targetRewardedLevel
                            + " otrzymujesz premię do sklepu nagród.",
                    "/learning-center"
            );
        }
    }

    private void addGems(GamificationProfile profile, long amount) {
        profile.setGemBalance(profile.getGemBalance() + amount);
        profile.setTotalGemsEarned(profile.getTotalGemsEarned() + amount);
    }

    private int applyXpBoost(GamificationProfile profile, int baseXp) {
        expireBoostIfNeeded(profile);
        return Math.max(0, Math.round(baseXp * (100 + profile.getXpBoostPercent()) / 100f));
    }

    private void expireBoostIfNeeded(GamificationProfile profile) {
        if (profile.getXpBoostExpiresAt() != null
                && !clock.instant().isBefore(profile.getXpBoostExpiresAt())) {
            profile.setXpBoostPercent(0);
            profile.setXpBoostExpiresAt(null);
            profileRepository.save(profile);
        }
    }

    private void decrementVoucher(GamificationProfile profile, int percent) {
        int count = voucherCount(profile, percent);
        if (count <= 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Nie masz kuponu " + percent + "%");
        }
        setVoucherCount(profile, percent, count - 1);
    }

    private void incrementVoucher(GamificationProfile profile, int percent) {
        setVoucherCount(profile, percent, voucherCount(profile, percent) + 1);
    }

    private int voucherCount(GamificationProfile profile, int percent) {
        return switch (percent) {
            case 5 -> profile.getVoucher5Count();
            case 10 -> profile.getVoucher10Count();
            case 20 -> profile.getVoucher20Count();
            default -> 0;
        };
    }

    private void setVoucherCount(GamificationProfile profile, int percent, int count) {
        switch (percent) {
            case 5 -> profile.setVoucher5Count(count);
            case 10 -> profile.setVoucher10Count(count);
            case 20 -> profile.setVoucher20Count(count);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nieprawidłowy kupon");
        }
    }

    private AwardResult currentResult(
            GamificationProfile profile,
            int xpEarned,
            boolean levelUp,
            int gemsEarned
    ) {
        int effectiveStreak = effectiveTaskStreak(profile, clock.instant());
        return new AwardResult(
                xpEarned,
                multiplierFor(effectiveStreak),
                effectiveStreak,
                profile.getLevel(),
                levelUp,
                gemsEarned,
                profile.getGemBalance(),
                profile.getXpBoostPercent()
        );
    }

    private GamificationSnapshot snapshot(GamificationProfile profile) {
        Instant now = clock.instant();
        int effectiveStreak = effectiveTaskStreak(profile, now);
        Instant streakExpiresAt = effectiveStreak > 0
                ? profile.getCorrectTaskStreakUpdatedAt().plus(TASK_STREAK_TTL)
                : null;
        long levelStartXp = xpRequiredForLevel(profile.getLevel());
        long nextLevelXp = xpRequiredForLevel(profile.getLevel() + 1);
        LearningLeague league = LearningLeague.forLevel(profile.getLevel());

        return new GamificationSnapshot(
                profile.getTotalXp(),
                profile.getLevel(),
                levelStartXp,
                nextLevelXp,
                Math.max(0, profile.getTotalXp() - levelStartXp),
                Math.max(1, nextLevelXp - levelStartXp),
                effectiveStreak,
                profile.getBestCorrectTaskStreak(),
                multiplierFor(effectiveStreak),
                streakExpiresAt,
                profile.getGemBalance(),
                profile.getTotalGemsEarned(),
                nextGemRewardLevel(profile.getLevel()),
                GEMS_PER_LEVEL_MILESTONE,
                profile.getVoucher5Count(),
                profile.getVoucher10Count(),
                profile.getVoucher20Count(),
                profile.getXpBoostPercent(),
                profile.getXpBoostExpiresAt(),
                league.displayName(),
                league.color(),
                league.nextLevel()
        );
    }

    private int nextGemRewardLevel(int level) {
        return (level / GEM_LEVEL_INTERVAL + 1) * GEM_LEVEL_INTERVAL;
    }

    private int effectiveTaskStreak(GamificationProfile profile, Instant now) {
        if (profile.getCorrectTaskStreak() <= 0
                || profile.getCorrectTaskStreakUpdatedAt() == null) {
            return 0;
        }
        Instant expiresAt = profile.getCorrectTaskStreakUpdatedAt()
                .plus(TASK_STREAK_TTL);
        return now.isBefore(expiresAt) ? profile.getCorrectTaskStreak() : 0;
    }

    public record AwardResult(
            int xpEarned,
            int multiplier,
            int taskStreak,
            int level,
            boolean levelUp,
            int gemsEarned,
            long gemBalance,
            int xpBoostPercent
    ) {
    }

    public record GamificationSnapshot(
            long xp,
            int level,
            long levelStartXp,
            long nextLevelXp,
            long xpIntoLevel,
            long xpForNextLevel,
            int taskStreak,
            int bestTaskStreak,
            int xpMultiplier,
            Instant taskStreakExpiresAt,
            long gemBalance,
            long totalGemsEarned,
            int nextGemRewardLevel,
            int nextGemRewardAmount,
            int voucher5Count,
            int voucher10Count,
            int voucher20Count,
            int xpBoostPercent,
            Instant xpBoostExpiresAt,
            String leagueName,
            String leagueColor,
            Integer nextLeagueLevel
    ) {
    }
}

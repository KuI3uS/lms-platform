package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.LanguageReviewDto;
import com.twojlogin.lms.entity.LanguageReviewProgress;
import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.LanguageReviewProgressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
public class LanguageReviewService {

    private final LanguageReviewProgressRepository repository;
    private final Clock clock;

    @Autowired
    public LanguageReviewService(LanguageReviewProgressRepository repository) {
        this(repository, Clock.systemUTC());
    }

    LanguageReviewService(LanguageReviewProgressRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional
    public LanguageReviewDto record(User user, LessonBlock block, int rawScore) {
        if (!isLanguageBlock(block)) return null;

        int score = Math.max(0, Math.min(100, rawScore));
        Instant now = clock.instant();
        LanguageReviewProgress review = repository.findByUserAndBlock(user, block)
                .orElseGet(LanguageReviewProgress::new);
        review.setUser(user);
        review.setBlock(block);
        review.setLastScore(score);
        review.setUpdatedAt(now);

        if (score >= 90) {
            int nextRepetitions = review.getRepetitions() + 1;
            int nextInterval = switch (nextRepetitions) {
                case 1 -> 1;
                case 2 -> 3;
                default -> Math.max(4, (int) Math.round(
                        review.getIntervalDays() * review.getEaseFactor()
                ));
            };
            review.setRepetitions(nextRepetitions);
            review.setIntervalDays(Math.min(nextInterval, 180));
            review.setEaseFactor(Math.min(2.8, review.getEaseFactor() + 0.1));
            review.setNextReviewAt(now.plus(Duration.ofDays(review.getIntervalDays())));
        } else if (score >= 70) {
            review.setIntervalDays(1);
            review.setEaseFactor(Math.max(1.3, review.getEaseFactor() - 0.1));
            review.setNextReviewAt(now.plus(Duration.ofHours(12)));
        } else {
            review.setRepetitions(0);
            review.setIntervalDays(0);
            review.setEaseFactor(Math.max(1.3, review.getEaseFactor() - 0.2));
            review.setNextReviewAt(now.plus(Duration.ofMinutes(10)));
        }

        return LanguageReviewDto.from(repository.save(review));
    }

    @Transactional(readOnly = true)
    public List<LanguageReviewDto> due(User user) {
        return repository.findDue(user.getId(), clock.instant()).stream()
                .map(LanguageReviewDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public long dueCount(User user) {
        return repository.countByUserIdAndNextReviewAtLessThanEqual(
                user.getId(),
                clock.instant()
        );
    }

    private boolean isLanguageBlock(LessonBlock block) {
        try {
            return block != null
                    && block.getLesson() != null
                    && block.getLesson().getModule() != null
                    && block.getLesson().getModule().getCourse() != null
                    && "LANGUAGE".equalsIgnoreCase(
                            block.getLesson().getModule().getCourse().getCategory()
                    );
        } catch (RuntimeException ignored) {
            return false;
        }
    }
}

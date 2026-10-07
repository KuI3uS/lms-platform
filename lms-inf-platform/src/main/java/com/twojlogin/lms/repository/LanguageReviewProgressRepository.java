package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.LanguageReviewProgress;
import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface LanguageReviewProgressRepository
        extends JpaRepository<LanguageReviewProgress, Long> {

    Optional<LanguageReviewProgress> findByUserAndBlock(User user, LessonBlock block);

    @EntityGraph(attributePaths = {
            "block",
            "block.lesson",
            "block.lesson.module",
            "block.lesson.module.course"
    })
    @Query("""
            select review
            from LanguageReviewProgress review
            where review.user.id = :userId
              and review.nextReviewAt <= :now
              and review.block.published = true
            order by review.nextReviewAt asc
            """)
    List<LanguageReviewProgress> findDue(
            @Param("userId") Long userId,
            @Param("now") Instant now
    );

    long countByUserIdAndNextReviewAtLessThanEqual(Long userId, Instant now);
    void deleteByBlockId(Long blockId);
    void deleteByBlockLessonId(Long lessonId);
    void deleteByUserId(Long userId);
}

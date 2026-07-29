package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.entity.TaskAttempt;
import com.twojlogin.lms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

public interface TaskAttemptRepository extends JpaRepository<TaskAttempt, Long> {

    Optional<TaskAttempt> findByUserAndBlock(User user, LessonBlock block);

    List<TaskAttempt> findByUserIdAndBlockLessonId(Long userId, Long lessonId);

    void deleteByBlockId(Long blockId);

    void deleteByBlockLessonId(Long lessonId);

    void deleteByUserId(Long userId);

    @Query("""
            select count(attempt)
            from TaskAttempt attempt
            where attempt.user.id = :userId
              and attempt.block.lesson.id = :lessonId
              and attempt.block.type = com.twojlogin.lms.entity.BlockType.TASK
              and attempt.block.published = true
              and attempt.correct = true
            """)
    long countCorrectTasksByUserAndLesson(
            @Param("userId") Long userId,
            @Param("lessonId") Long lessonId
    );

    @Query("""
            select count(attempt)
            from TaskAttempt attempt
            where attempt.user.id = :userId
              and attempt.block.lesson.id = :lessonId
              and attempt.block.type in (
                com.twojlogin.lms.entity.BlockType.TASK,
                com.twojlogin.lms.entity.BlockType.QUIZ
              )
              and attempt.block.published = true
              and attempt.correct = true
            """)
    long countCorrectAssessmentsByUserAndLesson(
            @Param("userId") Long userId,
            @Param("lessonId") Long lessonId
    );

    List<TaskAttempt> findTop5ByUserIdOrderByAttemptCountDesc(Long userId);

    long countByUserId(Long userId);

    long countByUserIdAndCorrectTrue(Long userId);

    @Query("""
            select coalesce(sum(
                case
                    when attempt.block.points is null or attempt.block.points <= 0 then 10
                    else attempt.block.points
                end
            ), 0)
            from TaskAttempt attempt
            where attempt.user.id = :userId
              and attempt.correct = true
            """)
    long sumHistoricalBaseXpByUserId(@Param("userId") Long userId);
}

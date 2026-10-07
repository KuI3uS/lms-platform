package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.ExamAttempt;
import com.twojlogin.lms.entity.ExamAttemptStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, Long> {

    Optional<ExamAttempt> findByPublicId(String publicId);

    List<ExamAttempt> findByUserIdOrderByStartedAtDesc(Long userId);

    long countByUserIdAndStatus(Long userId, ExamAttemptStatus status);

    boolean existsByUserIdAndStatusAndPercentageGreaterThanEqual(
            Long userId,
            ExamAttemptStatus status,
            double percentage
    );

    @Query("""
            select coalesce(avg(attempt.percentage), 0)
            from ExamAttempt attempt
            where attempt.user.id = :userId
              and attempt.status = com.twojlogin.lms.entity.ExamAttemptStatus.SUBMITTED
            """)
    double averagePercentageByUserId(@Param("userId") Long userId);

    void deleteByUserId(Long userId);

    void deleteByCourseId(Long courseId);
}

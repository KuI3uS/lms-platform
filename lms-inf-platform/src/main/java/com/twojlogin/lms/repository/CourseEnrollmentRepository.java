package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.CourseEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, Long> {

    @Query("""
            select count(enrollment) > 0
            from CourseEnrollment enrollment
            where enrollment.user.id = :userId
              and enrollment.course.id = :courseId
              and enrollment.active = true
              and (enrollment.accessExpiresAt is null or enrollment.accessExpiresAt > :now)
            """)
    boolean hasActiveAccess(
            @Param("userId") Long userId,
            @Param("courseId") Long courseId,
            @Param("now") LocalDateTime now
    );

    Optional<CourseEnrollment> findByUserIdAndCourseId(Long userId, Long courseId);

    List<CourseEnrollment> findByUserIdAndActiveTrueOrderByEnrolledAtDesc(Long userId);

    @Query("""
            select enrollment.course.id, enrollment.accessExpiresAt
            from CourseEnrollment enrollment
            where enrollment.user.id = :userId
              and enrollment.active = true
              and (enrollment.accessExpiresAt is null or enrollment.accessExpiresAt > :now)
            """)
    List<Object[]> findAccessibleCoursesByUserId(
            @Param("userId") Long userId,
            @Param("now") LocalDateTime now
    );

    void deleteByUserId(Long userId);

    void deleteByCourseId(Long courseId);
}

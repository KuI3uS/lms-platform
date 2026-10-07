package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.CourseEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, Long> {

    boolean existsByUserIdAndCourseIdAndActiveTrue(Long userId, Long courseId);

    Optional<CourseEnrollment> findByUserIdAndCourseId(Long userId, Long courseId);

    List<CourseEnrollment> findByUserIdAndActiveTrueOrderByEnrolledAtDesc(Long userId);

    @Query("""
            select enrollment.course.id
            from CourseEnrollment enrollment
            where enrollment.user.id = :userId
              and enrollment.active = true
            """)
    List<Long> findActiveCourseIdsByUserId(@Param("userId") Long userId);

    void deleteByUserId(Long userId);

    void deleteByCourseId(Long courseId);
}

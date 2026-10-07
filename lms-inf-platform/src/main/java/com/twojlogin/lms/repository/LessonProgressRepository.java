package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.entity.LessonProgress;
import com.twojlogin.lms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;
import java.time.LocalDateTime;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {

    Optional<LessonProgress> findByUserAndLesson(User user, Lesson lesson);

    boolean existsByUserAndLessonAndCompletedTrue(User user, Lesson lesson);

    void deleteByLessonId(Long lessonId);

    void deleteByUserId(Long userId);

    long countByUserIdAndCompletedTrue(Long userId);

    @Query("""
            select progress.completedAt
            from LessonProgress progress
            where progress.user.id = :userId
              and progress.completed = true
              and progress.completedAt is not null
            order by progress.completedAt desc
            """)
    List<LocalDateTime> findCompletedDatesByUserId(@Param("userId") Long userId);

    @Query("""
            select count(progress)
            from LessonProgress progress
            where progress.user.id = :userId
              and progress.lesson.module.course.id = :courseId
              and progress.completed = true
            """)
    long countCompletedByUserIdAndCourseId(
            @Param("userId") Long userId,
            @Param("courseId") Long courseId
    );
}

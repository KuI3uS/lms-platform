package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.entity.LessonProgress;
import com.twojlogin.lms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {

    Optional<LessonProgress> findByUserAndLesson(User user, Lesson lesson);

    boolean existsByUserAndLessonAndCompletedTrue(User user, Lesson lesson);

    void deleteByLessonId(Long lessonId);

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

package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.entity.LessonProgress;
import com.twojlogin.lms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LessonProgressRepository extends JpaRepository<LessonProgress, Long> {

    Optional<LessonProgress> findByUserAndLesson(User user, Lesson lesson);

    boolean existsByUserAndLessonAndCompletedTrue(User user, Lesson lesson);

    void deleteByLessonId(Long lessonId);
}
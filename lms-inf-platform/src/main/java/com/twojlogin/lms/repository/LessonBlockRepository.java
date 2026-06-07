package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.LessonBlock;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LessonBlockRepository extends JpaRepository<LessonBlock, Long> {

    List<LessonBlock> findByLessonIdOrderByOrderIndexAsc(Long lessonId);

    int countByLessonId(Long lessonId);
}
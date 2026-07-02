package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.LessonBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface LessonBlockRepository extends JpaRepository<LessonBlock, Long> {

    @Query("""
    select coalesce(max(b.orderIndex), -1)
    from LessonBlock b
    where b.lesson.id = :lessonId
    """)
    Integer findMaxOrderIndexByLessonId(Long lessonId);

    List<LessonBlock> findByLessonId(Long lessonId);

    List<LessonBlock> findByLessonIdOrderByOrderIndexAsc(Long lessonId);

    int countByLessonId(Long lessonId);

    List<LessonBlock> findByTaskId(Long taskId);
}
package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.entity.BlockType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    int countByLessonIdAndPublishedTrue(Long lessonId);

    @Query("""
            select block.lesson.id, count(block)
            from LessonBlock block
            where block.lesson.id in :lessonIds
              and block.published = true
            group by block.lesson.id
            """)
    List<Object[]> countPublishedByLessonIds(
            @Param("lessonIds") List<Long> lessonIds
    );

    long countByLessonIdAndTypeAndPublishedTrue(Long lessonId, BlockType type);

    @Query("""
            select count(block)
            from LessonBlock block
            where block.lesson.id = :lessonId
              and block.type in (
                com.twojlogin.lms.entity.BlockType.TASK,
                com.twojlogin.lms.entity.BlockType.QUIZ
              )
              and block.published = true
            """)
    long countRequiredAssessmentsByLessonId(Long lessonId);
}

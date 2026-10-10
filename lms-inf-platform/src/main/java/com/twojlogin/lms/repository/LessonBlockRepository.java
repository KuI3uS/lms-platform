package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.entity.BlockType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
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

    // A projection avoids retaining all block entities in the persistence context.
    @Query("""
            select b.lesson.id, b.title, b.type, b.content, b.description,
                   b.instruction, b.starterCode, b.expectedAnswer, b.hint,
                   b.detailedHint, b.solutionExplanation, b.language, b.hiddenTests,
                   b.mediaUrl, b.mediaType, b.published, b.points, b.orderIndex
            from LessonBlock b where b.lesson.id in :lessonIds
            order by b.lesson.id, b.orderIndex, b.id
            """)
    List<Object[]> findDuplicateComparisonData(@Param("lessonIds") List<Long> lessonIds);

    @Modifying
    @Query("delete from LessonBlock b where b.lesson.id in :lessonIds")
    int deleteUnusedByLessonIds(@Param("lessonIds") List<Long> lessonIds);

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
                com.twojlogin.lms.entity.BlockType.PRACTICAL_LAB,
                com.twojlogin.lms.entity.BlockType.DEBUGGING,
                com.twojlogin.lms.entity.BlockType.PREDICT_OUTPUT,
                com.twojlogin.lms.entity.BlockType.CODE_REVIEW,
                com.twojlogin.lms.entity.BlockType.OPEN_RESPONSE,
                com.twojlogin.lms.entity.BlockType.QUIZ,
                com.twojlogin.lms.entity.BlockType.DIALOG,
                com.twojlogin.lms.entity.BlockType.VOCABULARY,
                com.twojlogin.lms.entity.BlockType.WORD_LAB,
                com.twojlogin.lms.entity.BlockType.LISTENING,
                com.twojlogin.lms.entity.BlockType.SENTENCE_BUILDER,
                com.twojlogin.lms.entity.BlockType.AUDIO
              )
              and block.published = true
            """)
    long countRequiredAssessmentsByLessonId(Long lessonId);
}

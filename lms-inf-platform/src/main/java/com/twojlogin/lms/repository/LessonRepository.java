package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LessonRepository extends JpaRepository<Lesson, Long> {

    List<Lesson> findByModuleIdOrderByOrderIndexAsc(Long moduleId);

    @Query("""
            select lesson
            from Lesson lesson
            join fetch lesson.module module
            where module.course.id = :courseId
            order by module.id asc, lesson.orderIndex asc, lesson.id asc
            """)
    List<Lesson> findRoadmapLessonsByCourseId(
            @Param("courseId") Long courseId
    );

    @Query("""
            select lesson.id from Lesson lesson
            where lesson.module.course.id = :courseId and (
                exists (select p.id from LessonProgress p where p.lesson = lesson)
                or exists (select s.id from LessonSubmission s where s.lesson = lesson)
                or exists (select a.id from TaskAttempt a where a.block.lesson = lesson)
                or exists (select r.id from LanguageReviewProgress r where r.block.lesson = lesson)
            )
            """)
    List<Long> findUsedLessonIdsByCourseId(@Param("courseId") Long courseId);

    long countByModuleCourseId(Long courseId);

    @Query("""
            select lesson.module.course.id, count(lesson)
            from Lesson lesson
            where lesson.module.course.id in :courseIds
            group by lesson.module.course.id
            """)
    List<Object[]> countByCourseIds(@Param("courseIds") List<Long> courseIds);

    long countByModuleId(Long moduleId);

    Optional<Lesson> findFirstByModuleIdAndOrderIndexLessThanOrderByOrderIndexDesc(
            Long moduleId,
            Integer orderIndex
    );

    Optional<Lesson> findFirstByModuleIdAndOrderIndexGreaterThanOrderByOrderIndexAsc(
            Long moduleId,
            Integer orderIndex
    );

}

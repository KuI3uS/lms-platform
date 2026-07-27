package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface LessonRepository extends JpaRepository<Lesson, Long> {

    List<Lesson> findByModuleIdOrderByOrderIndexAsc(Long moduleId);

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

package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.CourseModule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CourseModuleRepository extends JpaRepository<CourseModule, Long> {
    List<CourseModule> findByCourseId(Long courseId);

    List<CourseModule> findByCourseIdOrderByIdAsc(Long courseId);

    long countByCourseId(Long courseId);

    @Query("""
            select module.course.id, count(module)
            from CourseModule module
            where module.course.id in :courseIds
            group by module.course.id
            """)
    List<Object[]> countByCourseIds(@Param("courseIds") List<Long> courseIds);

    @Query(value = """
            select count(*)
            from course_module cm
            where exists (
                select 1
                from lesson l
                where l.module_id = cm.id
            )
              and not exists (
                select 1
                from lesson l
                where l.module_id = cm.id
                  and not exists (
                      select 1
                      from lesson_progress lp
                      where lp.lesson_id = l.id
                        and lp.user_id = :userId
                        and lp.completed = true
                  )
            )
            """, nativeQuery = true)
    long countCompletedModulesByUserId(@Param("userId") Long userId);
}

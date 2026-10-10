package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface CourseRepository extends JpaRepository<Course, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select course from Course course where course.id = :id")
    Optional<Course> findByIdForImport(@Param("id") Long id);

    List<Course> findAllByOrderByIdAsc();

    List<Course> findByPublishedTrueOrderByIdAsc();
}

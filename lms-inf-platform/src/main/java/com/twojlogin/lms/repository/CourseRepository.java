package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseRepository extends JpaRepository<Course, Long> {

    List<Course> findAllByOrderByIdAsc();

    List<Course> findByPublishedTrueOrderByIdAsc();
}

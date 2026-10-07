package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.CourseProgress;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CourseProgressRepository extends JpaRepository<CourseProgress, Long> {

    void deleteByUserId(Long userId);
}

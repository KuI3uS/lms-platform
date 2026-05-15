package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.LessonSubmission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LessonSubmissionRepository extends JpaRepository<LessonSubmission, Long> {

    List<LessonSubmission> findAllByOrderBySubmittedAtDesc();

    List<LessonSubmission> findByUserIdOrderBySubmittedAtDesc(Long userId);
}
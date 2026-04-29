package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.Submission;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.List;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    @Modifying
    @Transactional
    void deleteByUserId(Long userId);
    List<Submission> findByUserId(Long userId);

}
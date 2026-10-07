package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.ExamAttemptQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExamAttemptQuestionRepository extends JpaRepository<ExamAttemptQuestion, Long> {
}

package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.Answer;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AnswerRepository extends JpaRepository<Answer, Long> {
}
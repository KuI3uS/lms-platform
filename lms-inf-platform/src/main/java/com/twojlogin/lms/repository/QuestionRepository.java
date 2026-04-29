package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByModuleId(Long moduleId);
}
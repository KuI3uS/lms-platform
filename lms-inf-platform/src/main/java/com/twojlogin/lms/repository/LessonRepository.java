package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LessonRepository extends JpaRepository<Lesson, Long> {

    List<Lesson> findByModuleIdOrderByOrderIndexAsc(Long moduleId);

    Optional<Lesson> findFirstByModuleIdAndOrderIndexLessThanOrderByOrderIndexDesc(
            Long moduleId,
            Integer orderIndex
    );

}
package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.CourseAccessCode;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.List;
import java.util.Optional;

public interface CourseAccessCodeRepository extends JpaRepository<CourseAccessCode, Long> {
    boolean existsByCodeHash(String codeHash);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<CourseAccessCode> findByCodeHash(String codeHash);

    List<CourseAccessCode> findAllByOrderByCreatedAtDesc();
}

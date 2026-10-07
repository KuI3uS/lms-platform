package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.CourseCertificate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseCertificateRepository extends JpaRepository<CourseCertificate, Long> {

    Optional<CourseCertificate> findByUserIdAndCourseId(Long userId, Long courseId);

    List<CourseCertificate> findByUserIdOrderByIssuedAtDesc(Long userId);

    Optional<CourseCertificate> findByCertificateNumber(String certificateNumber);

    long countByUserId(Long userId);

    void deleteByUserId(Long userId);

    void deleteByCourseId(Long courseId);
}

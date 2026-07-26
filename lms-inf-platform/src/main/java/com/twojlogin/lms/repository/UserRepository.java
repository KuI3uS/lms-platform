package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    List<User> findBySchoolClassId(Long classId);

    Optional<User> findByVerificationToken(String verificationToken);
}

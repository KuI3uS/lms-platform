package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.GamificationProfile;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface GamificationProfileRepository
        extends JpaRepository<GamificationProfile, Long> {

    Optional<GamificationProfile> findByUserId(Long userId);

    void deleteByUserId(Long userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select profile
            from GamificationProfile profile
            where profile.user.id = :userId
            """)
    Optional<GamificationProfile> findByUserIdForUpdate(@Param("userId") Long userId);
}

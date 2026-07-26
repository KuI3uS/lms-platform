package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.AchievementType;
import com.twojlogin.lms.entity.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserAchievementRepository extends JpaRepository<UserAchievement, Long> {

    boolean existsByUserIdAndType(Long userId, AchievementType type);

    List<UserAchievement> findByUserIdOrderByUnlockedAtAsc(Long userId);

    void deleteByUserId(Long userId);
}

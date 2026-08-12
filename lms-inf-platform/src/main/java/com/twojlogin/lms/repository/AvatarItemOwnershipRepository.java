package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.AvatarItemOwnership;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AvatarItemOwnershipRepository
        extends JpaRepository<AvatarItemOwnership, Long> {

    List<AvatarItemOwnership> findByUserId(Long userId);

    boolean existsByUserIdAndItemCode(Long userId, String itemCode);

    void deleteByUserId(Long userId);
}

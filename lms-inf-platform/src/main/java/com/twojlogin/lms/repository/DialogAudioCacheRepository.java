package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.DialogAudioCache;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DialogAudioCacheRepository extends JpaRepository<DialogAudioCache, Long> {
    Optional<DialogAudioCache> findByCacheKey(String cacheKey);
}

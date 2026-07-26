package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.StudyActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface StudyActivityRepository extends JpaRepository<StudyActivity, Long> {

    Optional<StudyActivity> findByUserIdAndActivityDate(Long userId, LocalDate activityDate);

    @Query("select coalesce(sum(activity.totalSeconds), 0) from StudyActivity activity where activity.user.id = :userId")
    long sumTotalSecondsByUserId(@Param("userId") Long userId);

    List<StudyActivity> findTop14ByUserIdOrderByActivityDateDesc(Long userId);

    void deleteByUserId(Long userId);
}

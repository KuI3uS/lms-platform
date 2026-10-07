package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.TutoringAvailability;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TutoringAvailabilityRepository
        extends JpaRepository<TutoringAvailability, Long> {
    List<TutoringAvailability> findByAvailableTrueOrderByStartTimeAsc();

}
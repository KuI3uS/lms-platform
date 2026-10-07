package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.TutoringBooking;
import com.twojlogin.lms.entity.TutoringStatus;
import com.twojlogin.lms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

public interface TutoringBookingRepository extends JpaRepository<TutoringBooking, Long> {

    List<TutoringBooking> findAllByOrderByStartTimeAsc();

    List<TutoringBooking> findByStudentOrderByStartTimeDesc(User student);

    boolean existsByStatusInAndStartTimeLessThanAndEndTimeGreaterThan(
            Collection<TutoringStatus> statuses,
            LocalDateTime endTime,
            LocalDateTime startTime
    );

    List<TutoringBooking> findByStatusAndPaymentDeadlineBefore(
            TutoringStatus status,
            LocalDateTime now
    );
}

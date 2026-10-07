package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.TutoringBooking;
import com.twojlogin.lms.entity.TutoringStatus;
import com.twojlogin.lms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TutoringBookingRepository extends JpaRepository<TutoringBooking, Long> {

    List<TutoringBooking> findAllByOrderByStartTimeAsc();

    List<TutoringBooking> findByStudentOrderByStartTimeDesc(User student);

    @Query("""
        SELECT COUNT(b) > 0
        FROM TutoringBooking b
        WHERE b.startTime < :endTime
          AND b.endTime > :startTime
          AND (
                b.status = com.twojlogin.lms.entity.TutoringStatus.PAID
                OR (
                    b.status = com.twojlogin.lms.entity.TutoringStatus.PENDING_PAYMENT
                    AND b.paymentDeadline > :now
                )
          )
    """)
    boolean existsActiveConflict(
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("now") LocalDateTime now
    );

    @Query("""
        SELECT b
        FROM TutoringBooking b
        WHERE b.status = com.twojlogin.lms.entity.TutoringStatus.PAID
           OR (
                b.status = com.twojlogin.lms.entity.TutoringStatus.PENDING_PAYMENT
                AND b.paymentDeadline > :now
           )
    """)
    List<TutoringBooking> findActiveBlockedBookings(
            @Param("now") LocalDateTime now
    );

    List<TutoringBooking> findByStatusAndPaymentDeadlineBefore(
            TutoringStatus status,
            LocalDateTime now
    );
}
package com.twojlogin.lms.service;

import com.twojlogin.lms.entity.TutoringBooking;
import com.twojlogin.lms.entity.TutoringStatus;
import com.twojlogin.lms.repository.TutoringBookingRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TutoringPaymentCleanupService {

    private final TutoringBookingRepository bookingRepository;

    public TutoringPaymentCleanupService(TutoringBookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    @Scheduled(fixedRate = 60000)
    public void cancelExpiredPayments() {
        List<TutoringBooking> expired = bookingRepository
                .findByStatusAndPaymentDeadlineBefore(
                        TutoringStatus.PENDING_PAYMENT,
                        LocalDateTime.now()
                );

        for (TutoringBooking booking : expired) {
            booking.setStatus(TutoringStatus.CANCELLED);
        }

        bookingRepository.saveAll(expired);
    }
}
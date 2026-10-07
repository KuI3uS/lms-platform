package com.twojlogin.lms.dto;

import com.twojlogin.lms.entity.TutoringBooking;
import com.twojlogin.lms.entity.TutoringStatus;

import java.time.LocalDateTime;

public record TutoringBookingDto(
        Long id,
        String guestName,
        String guestEmail,
        String guestPhone,
        Integer hours,
        Integer price,
        LocalDateTime startTime,
        LocalDateTime endTime,
        LocalDateTime paymentDeadline,
        String topic,
        String studentMessage,
        String adminComment,
        String meetingLink,
        TutoringStatus status,
        LocalDateTime createdAt
) {
    public static TutoringBookingDto from(TutoringBooking booking) {
        return new TutoringBookingDto(
                booking.getId(),
                booking.getGuestName(),
                booking.getGuestEmail(),
                booking.getGuestPhone(),
                booking.getHours(),
                booking.getPrice(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getPaymentDeadline(),
                booking.getTopic(),
                booking.getStudentMessage(),
                booking.getAdminComment(),
                booking.getMeetingLink(),
                booking.getStatus(),
                booking.getCreatedAt()
        );
    }
}

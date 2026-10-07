package com.twojlogin.lms.dto;

import com.twojlogin.lms.entity.TutoringBooking;

import java.time.LocalDateTime;

public record TutoringBlockedSlotDto(
        LocalDateTime startTime,
        LocalDateTime endTime
) {
    public static TutoringBlockedSlotDto from(TutoringBooking booking) {
        return new TutoringBlockedSlotDto(booking.getStartTime(), booking.getEndTime());
    }
}

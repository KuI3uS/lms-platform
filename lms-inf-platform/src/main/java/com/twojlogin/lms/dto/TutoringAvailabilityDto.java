package com.twojlogin.lms.dto;

import com.twojlogin.lms.entity.TutoringAvailability;

import java.time.LocalDateTime;

public record TutoringAvailabilityDto(
        Long id,
        LocalDateTime startTime,
        LocalDateTime endTime
) {
    public static TutoringAvailabilityDto from(TutoringAvailability availability) {
        return new TutoringAvailabilityDto(
                availability.getId(),
                availability.getStartTime(),
                availability.getEndTime()
        );
    }
}

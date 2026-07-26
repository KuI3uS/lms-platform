package com.twojlogin.lms.dto;

import com.twojlogin.lms.entity.NotificationType;
import com.twojlogin.lms.entity.UserNotification;

import java.time.LocalDateTime;

public record NotificationDto(
        Long id,
        NotificationType type,
        String title,
        String message,
        String link,
        LocalDateTime createdAt,
        boolean read
) {
    public static NotificationDto from(UserNotification notification) {
        return new NotificationDto(
                notification.getId(),
                notification.getType(),
                notification.getTitle(),
                notification.getMessage(),
                notification.getLink(),
                notification.getCreatedAt(),
                notification.getReadAt() != null
        );
    }
}

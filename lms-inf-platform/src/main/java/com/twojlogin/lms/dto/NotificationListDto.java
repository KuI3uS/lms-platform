package com.twojlogin.lms.dto;

import java.util.List;

public record NotificationListDto(
        long unreadCount,
        List<NotificationDto> notifications
) {
}

package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.NotificationDto;
import com.twojlogin.lms.dto.NotificationListDto;
import com.twojlogin.lms.service.NotificationService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public NotificationListDto get(Authentication authentication) {
        return notificationService.getFor(authentication);
    }

    @PutMapping("/{id}/read")
    public NotificationDto markRead(
            @PathVariable Long id,
            Authentication authentication
    ) {
        return notificationService.markRead(id, authentication);
    }

    @PutMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead(Authentication authentication) {
        notificationService.markAllRead(authentication);
    }
}

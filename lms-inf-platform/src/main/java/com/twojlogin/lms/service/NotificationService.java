package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.NotificationDto;
import com.twojlogin.lms.dto.NotificationListDto;
import com.twojlogin.lms.entity.NotificationType;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.entity.UserNotification;
import com.twojlogin.lms.repository.UserNotificationRepository;
import com.twojlogin.lms.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private final UserNotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(
            UserNotificationRepository notificationRepository,
            UserRepository userRepository
    ) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void create(
            User user,
            NotificationType type,
            String title,
            String message,
            String link
    ) {
        UserNotification notification = new UserNotification();
        notification.setUser(user);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setLink(link);
        notification.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public NotificationListDto getFor(Authentication authentication) {
        User user = currentUser(authentication);
        List<NotificationDto> notifications = notificationRepository
                .findTop50ByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(NotificationDto::from)
                .toList();

        return new NotificationListDto(
                notificationRepository.countByUserIdAndReadAtIsNull(user.getId()),
                notifications
        );
    }

    @Transactional
    public NotificationDto markRead(Long id, Authentication authentication) {
        User user = currentUser(authentication);
        UserNotification notification = notificationRepository
                .findByIdAndUserId(id, user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Nie znaleziono powiadomienia"
                ));

        if (notification.getReadAt() == null) {
            notification.setReadAt(LocalDateTime.now());
        }
        return NotificationDto.from(notificationRepository.save(notification));
    }

    @Transactional
    public void markAllRead(Authentication authentication) {
        User user = currentUser(authentication);
        List<UserNotification> notifications =
                notificationRepository.findTop50ByUserIdOrderByCreatedAtDesc(user.getId());
        LocalDateTime now = LocalDateTime.now();
        notifications.stream()
                .filter(notification -> notification.getReadAt() == null)
                .forEach(notification -> notification.setReadAt(now));
        notificationRepository.saveAll(notifications);
    }

    private User currentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Wymagane logowanie");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Nie znaleziono użytkownika"
                ));
    }
}

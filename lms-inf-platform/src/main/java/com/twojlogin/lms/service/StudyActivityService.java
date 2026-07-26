package com.twojlogin.lms.service;

import com.twojlogin.lms.entity.StudyActivity;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.StudyActivityRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
public class StudyActivityService {

    private final StudyActivityRepository activityRepository;
    private final CourseAccessService accessService;

    public StudyActivityService(
            StudyActivityRepository activityRepository,
            CourseAccessService accessService
    ) {
        this.activityRepository = activityRepository;
        this.accessService = accessService;
    }

    @Transactional
    public long heartbeat(Authentication authentication) {
        User user = accessService.currentUser(authentication);
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        StudyActivity activity = activityRepository
                .findByUserIdAndActivityDate(user.getId(), today)
                .orElseGet(StudyActivity::new);

        if (activity.getId() == null) {
            activity.setUser(user);
            activity.setActivityDate(today);
            activity.setTotalSeconds(0);
        } else {
            long elapsed = Duration.between(activity.getLastHeartbeatAt(), now).getSeconds();
            if (elapsed > 0 && elapsed <= 120) {
                activity.setTotalSeconds(activity.getTotalSeconds() + elapsed);
            }
        }

        activity.setLastHeartbeatAt(now);
        return activityRepository.save(activity).getTotalSeconds();
    }
}

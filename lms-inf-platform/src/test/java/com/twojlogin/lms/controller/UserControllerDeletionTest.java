package com.twojlogin.lms.controller;

import com.twojlogin.lms.entity.CourseProgress;
import com.twojlogin.lms.entity.LessonSubmission;
import com.twojlogin.lms.entity.PasswordResetToken;
import com.twojlogin.lms.entity.Role;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.CourseProgressRepository;
import com.twojlogin.lms.repository.LessonSubmissionRepository;
import com.twojlogin.lms.repository.PasswordResetTokenRepository;
import com.twojlogin.lms.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

@SpringBootTest
@Transactional
class UserControllerDeletionTest {

    @Autowired
    private UserController controller;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LessonSubmissionRepository lessonSubmissionRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private CourseProgressRepository courseProgressRepository;

    @Test
    @WithMockUser(roles = "ADMIN")
    void permanentlyDeletesAccountAndPreviouslyOmittedUserData() {
        User user = new User();
        user.setEmail("usuwany@example.com");
        user.setPassword("encoded-password");
        user.setRole(Role.STUDENT);
        user.setEnabled(true);
        user = userRepository.saveAndFlush(user);

        LessonSubmission lessonSubmission = new LessonSubmission();
        lessonSubmission.setUser(user);
        lessonSubmissionRepository.saveAndFlush(lessonSubmission);

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setToken("reset-token");
        passwordResetTokenRepository.saveAndFlush(resetToken);

        CourseProgress courseProgress = new CourseProgress();
        courseProgress.setUser(user);
        courseProgressRepository.saveAndFlush(courseProgress);

        controller.deleteUser(user.getId());

        assertFalse(userRepository.existsById(user.getId()));
        assertEquals(0, lessonSubmissionRepository.count());
        assertEquals(0, passwordResetTokenRepository.count());
        assertEquals(0, courseProgressRepository.count());
    }
}

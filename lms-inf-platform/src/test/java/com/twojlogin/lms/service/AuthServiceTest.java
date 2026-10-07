package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.LoginRequest;
import com.twojlogin.lms.entity.Role;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.SchoolClassRepository;
import com.twojlogin.lms.repository.UserRepository;
import com.twojlogin.lms.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private SchoolClassRepository schoolClassRepository;
    @Mock
    private JwtService jwtService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private EmailService emailService;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                passwordEncoder,
                jwtService,
                schoolClassRepository,
                emailService
        );
    }

    @Test
    void loginReturnsClearForbiddenErrorForUnverifiedAccount() {
        User user = user(false);
        LoginRequest request = loginRequest(" Student@Example.com ", "correct-password");

        when(userRepository.findByEmailIgnoreCase("student@example.com"))
                .thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correct-password", "hash")).thenReturn(true);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> authService.login(request)
        );

        assertEquals(HttpStatus.FORBIDDEN.value(), exception.getStatusCode().value());
        assertTrue(exception.getReason().contains("aktywne"));
    }

    @Test
    void loginNormalizesEmailAndReturnsToken() {
        User user = user(true);
        LoginRequest request = loginRequest(" Student@Example.com ", "correct-password");

        when(userRepository.findByEmailIgnoreCase("student@example.com"))
                .thenReturn(Optional.of(user));
        when(passwordEncoder.matches("correct-password", "hash")).thenReturn(true);
        when(jwtService.generateToken("student@example.com", "STUDENT"))
                .thenReturn("jwt-token");

        assertEquals("jwt-token", authService.login(request));
    }

    @Test
    void verifyEmailActivatesAccountAndInvalidatesToken() {
        User user = user(false);
        user.setVerificationToken("verification-token");
        user.setVerificationTokenExpiresAt(LocalDateTime.now().plusHours(1));
        when(userRepository.findByVerificationToken("verification-token"))
                .thenReturn(Optional.of(user));

        authService.verifyEmail("verification-token");

        assertTrue(user.isEnabled());
        assertNull(user.getVerificationToken());
        assertNull(user.getVerificationTokenExpiresAt());
        verify(userRepository).save(user);
    }

    @Test
    void resendVerificationReplacesTokenForInactiveAccount() {
        User user = user(false);
        when(userRepository.findByEmailIgnoreCase("student@example.com"))
                .thenReturn(Optional.of(user));

        authService.resendVerification(" Student@Example.com ");

        assertNotNull(user.getVerificationToken());
        assertNotNull(user.getVerificationTokenExpiresAt());
        verify(userRepository).save(user);
        verify(emailService).sendVerificationEmail(
                eq("student@example.com"),
                eq(user.getVerificationToken())
        );
    }

    private User user(boolean enabled) {
        User user = new User();
        user.setId(1L);
        user.setEmail("student@example.com");
        user.setPassword("hash");
        user.setRole(Role.STUDENT);
        user.setEnabled(enabled);
        return user;
    }

    private LoginRequest loginRequest(String email, String password) {
        LoginRequest request = new LoginRequest();
        request.email = email;
        request.password = password;
        return request;
    }
}

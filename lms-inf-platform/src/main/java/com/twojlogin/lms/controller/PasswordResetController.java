package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.ForgotPasswordRequest;
import com.twojlogin.lms.dto.ResetPasswordRequest;
import com.twojlogin.lms.entity.PasswordResetToken;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.PasswordResetTokenRepository;
import com.twojlogin.lms.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class PasswordResetController {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JavaMailSender mailSender;

    public PasswordResetController(UserRepository userRepository,
                                   PasswordResetTokenRepository tokenRepository,
                                   PasswordEncoder passwordEncoder,
                                   JavaMailSender mailSender) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailSender = mailSender;
    }

    @Value("${frontend.url}")
    private String frontendUrl;

    @PostMapping("/forgot-password")
    public void forgotPassword(@RequestBody ForgotPasswordRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            return;
        }

        User user = userRepository.findByEmailIgnoreCase(request.getEmail().trim())
                .orElse(null);

        if (user == null) {
            return;
        }

        String token = UUID.randomUUID().toString();

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(30));
        resetToken.setUsed(false);

        tokenRepository.save(resetToken);

        String resetLink = frontendUrl + "/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(user.getEmail());
        message.setSubject("Reset hasła - LMS Panel");
        message.setText("""
                Kliknij link, aby zresetować hasło:

                %s

                Link jest ważny 30 minut.
                """.formatted(resetLink));

        mailSender.send(message);
    }

    @PostMapping("/reset-password")
    public void resetPassword(@RequestBody ResetPasswordRequest request) {
        if (request == null || request.getToken() == null || request.getToken().isBlank()
                || request.getNewPassword() == null || request.getNewPassword().length() < 8) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Link jest nieprawidłowy lub hasło ma mniej niż 8 znaków."
            );
        }

        PasswordResetToken resetToken = tokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Link do resetu hasła jest nieprawidłowy."
                ));

        if (resetToken.isUsed()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Link do resetu hasła został już użyty."
            );
        }

        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.GONE,
                    "Link do resetu hasła wygasł."
            );
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setEnabled(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiresAt(null);

        resetToken.setUsed(true);

        userRepository.save(user);
        tokenRepository.save(resetToken);
    }
}

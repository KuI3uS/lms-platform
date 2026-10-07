package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.LoginRequest;
import com.twojlogin.lms.dto.RegisterRequest;
import com.twojlogin.lms.entity.Role;
import com.twojlogin.lms.entity.SchoolClass;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.SchoolClassRepository;
import com.twojlogin.lms.repository.UserRepository;
import com.twojlogin.lms.security.JwtService;
import com.twojlogin.lms.util.ClassNameNormalizer;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.util.UUID;

import java.time.LocalDateTime;

@Service
public class AuthService {

    private final SchoolClassRepository schoolClassRepository;
    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            SchoolClassRepository schoolClassRepository,
            EmailService emailService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.schoolClassRepository = schoolClassRepository;
        this.emailService = emailService;
    }

    @Transactional
    public void register(RegisterRequest request) {
        String email = normalizeEmail(request == null ? null : request.email);
        String password = request == null ? null : request.password;

        if (email == null || !email.contains("@")
                || password == null || password.length() < 8) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Podaj poprawny email i hasło mające co najmniej 8 znaków."
            );
        }
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Konto z tym adresem email już istnieje."
            );
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setFirstName(request.firstName);
        user.setLastName(request.lastName);

        if (request.className != null && !request.className.isBlank()) {
            String normalizedClassName = ClassNameNormalizer.normalize(request.className);
            SchoolClass schoolClass = schoolClassRepository
                    .findByName(normalizedClassName)
                    .orElseGet(() -> {
                        SchoolClass newClass = new SchoolClass();
                        newClass.setName(normalizedClassName);
                        return schoolClassRepository.save(newClass);
                    });
            user.setSchoolClass(schoolClass);
        }

        String token = UUID.randomUUID().toString();

        user.setRole(Role.STUDENT);
        user.setEnabled(false);
        user.setVerificationToken(token);
        user.setVerificationTokenExpiresAt(LocalDateTime.now().plusHours(24));

        userRepository.save(user);

        emailService.sendVerificationEmail(user.getEmail(), token);
    }

    @Transactional(readOnly = true)
    public String login(LoginRequest request) {
        String email = normalizeEmail(request == null ? null : request.email);
        String password = request == null ? null : request.password;
        User user = email == null
                ? null
                : userRepository.findByEmailIgnoreCase(email).orElse(null);

        if (user == null || password == null
                || !passwordEncoder.matches(password, user.getPassword())) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Nieprawidłowy email lub hasło."
            );
        }

        if (!user.isEnabled()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Konto nie jest jeszcze aktywne. Potwierdź adres email lub wyślij link ponownie."
            );
        }

        return jwtService.generateToken(user.getEmail(), user.getRole().name());
    }

    @Transactional
    public void verifyEmail(String token) {
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Brakuje tokenu potwierdzającego."
            );
        }

        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Link potwierdzający jest nieprawidłowy lub został już użyty."
                ));

        if (user.getVerificationTokenExpiresAt() == null
                || user.getVerificationTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(
                    HttpStatus.GONE,
                    "Link potwierdzający wygasł. Wyślij nowy link."
            );
        }

        user.setEnabled(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiresAt(null);

        userRepository.save(user);
    }

    @Transactional
    public void resendVerification(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        if (email == null) return;

        userRepository.findByEmailIgnoreCase(email).ifPresent(user -> {
            if (user.isEnabled()) return;

            String token = UUID.randomUUID().toString();
            user.setVerificationToken(token);
            user.setVerificationTokenExpiresAt(LocalDateTime.now().plusHours(24));
            userRepository.save(user);
            emailService.sendVerificationEmail(user.getEmail(), token);
        });
    }

    private String normalizeEmail(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim().toLowerCase(Locale.ROOT);
    }
}

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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

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

    public void register(RegisterRequest request) {
        if (userRepository.findByEmail(request.email).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setEmail(request.email);
        user.setPassword(passwordEncoder.encode(request.password));
        user.setFirstName(request.firstName);
        user.setLastName(request.lastName);

        String normalizedClassName = ClassNameNormalizer.normalize(request.className);

        SchoolClass schoolClass = schoolClassRepository
                .findByName(normalizedClassName)
                .orElseGet(() -> {
                    SchoolClass newClass = new SchoolClass();
                    newClass.setName(normalizedClassName);
                    return schoolClassRepository.save(newClass);
                });

        String token = UUID.randomUUID().toString();

        user.setSchoolClass(schoolClass);
        user.setRole(Role.STUDENT);
        user.setEnabled(false);
        user.setVerificationToken(token);
        user.setVerificationTokenExpiresAt(LocalDateTime.now().plusHours(24));

        userRepository.save(user);

        emailService.sendVerificationEmail(user.getEmail(), token);
    }

    public String login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.password, user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        if (!user.isEnabled()) {
            throw new RuntimeException("Najpierw potwierdź adres email.");
        }

        return jwtService.generateToken(user.getEmail(), user.getRole().name());
    }

    public void verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("Nieprawidłowy token"));

        if (user.getVerificationTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token wygasł");
        }

        user.setEnabled(true);
        user.setVerificationToken(null);
        user.setVerificationTokenExpiresAt(null);

        userRepository.save(user);
    }
}
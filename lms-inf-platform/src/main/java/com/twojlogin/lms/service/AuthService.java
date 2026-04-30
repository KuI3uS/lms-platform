package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.LoginRequest;
import com.twojlogin.lms.dto.RegisterRequest;
import com.twojlogin.lms.entity.Role;
import com.twojlogin.lms.entity.SchoolClass;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.SchoolClassRepository;
import com.twojlogin.lms.repository.UserRepository;
import com.twojlogin.lms.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service

public class AuthService {

    private final SchoolClassRepository schoolClassRepository;

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       SchoolClassRepository schoolClassRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.schoolClassRepository = schoolClassRepository;
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

        SchoolClass schoolClass = schoolClassRepository
                .findByName(request.className)
                .orElseGet(() -> {
                    SchoolClass sc = new SchoolClass();
                    sc.setName(request.className);
                    return schoolClassRepository.save(sc);
                });

        user.setSchoolClass(schoolClass);
        user.setRole(Role.STUDENT);
        userRepository.save(user);
    }

    public String login(LoginRequest request) {

        User user = userRepository.findByEmail(request.email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(request.password, user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        return jwtService.generateToken(user.getEmail(), user.getRole().name());
    }
}
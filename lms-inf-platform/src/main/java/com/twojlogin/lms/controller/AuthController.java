package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.LoginRequest;
import com.twojlogin.lms.dto.RegisterRequest;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.service.AuthService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public void register(@RequestBody RegisterRequest request) {
        authService.register(request);
    }
    @PostMapping("/login")
    public java.util.Map<String, String> login(@RequestBody LoginRequest request) {

        String token = authService.login(request);

        return java.util.Map.of("token", token);
    }

    @GetMapping("/verify-email")
    public String verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return "Email został potwierdzony. Możesz się zalogować.";
    }
}
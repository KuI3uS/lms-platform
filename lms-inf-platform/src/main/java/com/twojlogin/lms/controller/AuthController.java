package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.LoginRequest;
import com.twojlogin.lms.dto.RegisterRequest;
import com.twojlogin.lms.dto.ForgotPasswordRequest;
import com.twojlogin.lms.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public void register(@RequestBody RegisterRequest request) {
        authService.register(request);
    }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody LoginRequest request) {
        String token = authService.login(request);
        return Map.of("token", token);
    }

    @GetMapping("/verify-email")
    public Map<String, String> verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return Map.of("message", "Email został potwierdzony. Możesz się zalogować.");
    }

    @PostMapping("/resend-verification")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resendVerification(@RequestBody ForgotPasswordRequest request) {
        authService.resendVerification(request.getEmail());
    }
}

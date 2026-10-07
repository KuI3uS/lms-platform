package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.LoginRequest;
import com.twojlogin.lms.dto.RegisterRequest;
import com.twojlogin.lms.dto.ForgotPasswordRequest;
import com.twojlogin.lms.dto.AuthSessionDto;
import com.twojlogin.lms.dto.AuthenticatedUserDto;
import com.twojlogin.lms.service.AuthService;
import com.twojlogin.lms.security.AuthCookieService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final AuthCookieService cookieService;

    public AuthController(AuthService authService, AuthCookieService cookieService) {
        this.authService = authService;
        this.cookieService = cookieService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public void register(@RequestBody RegisterRequest request) {
        authService.register(request);
    }

    @PostMapping("/login")
    public AuthSessionDto login(
            @RequestBody LoginRequest request,
            HttpServletResponse response
    ) {
        AuthService.LoginResult result = authService.login(request);
        String csrfToken = cookieService.issueSession(response, result.token());
        return new AuthSessionDto(
                AuthenticatedUserDto.from(result.user()),
                csrfToken
        );
    }

    @GetMapping("/csrf")
    public Map<String, String> csrf(HttpServletResponse response) {
        return Map.of("csrfToken", cookieService.refreshCsrf(response));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletResponse response) {
        cookieService.clearSession(response);
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

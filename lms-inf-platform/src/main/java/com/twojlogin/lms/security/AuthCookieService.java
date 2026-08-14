package com.twojlogin.lms.security;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;

@Service
public class AuthCookieService {

    public static final String SESSION_COOKIE = "EDUHUB_SESSION";
    public static final String CSRF_COOKIE = "EDUHUB_CSRF";
    public static final String CSRF_HEADER = "X-EDUHUB-CSRF";
    private static final Duration SESSION_TTL = Duration.ofHours(12);

    private final SecureRandom secureRandom = new SecureRandom();
    private final boolean secure;
    private final String sameSite;

    public AuthCookieService(
            @Value("${auth.cookie.secure:true}") boolean secure,
            @Value("${auth.cookie.same-site:Lax}") String sameSite
    ) {
        this.secure = secure;
        this.sameSite = sameSite;
    }

    public String issueSession(
            HttpServletResponse response,
            String jwt
    ) {
        String csrfToken = newCsrfToken();
        add(response, cookie(SESSION_COOKIE, jwt, true, SESSION_TTL));
        add(response, cookie(CSRF_COOKIE, csrfToken, false, SESSION_TTL));
        return csrfToken;
    }

    public String refreshCsrf(HttpServletResponse response) {
        String csrfToken = newCsrfToken();
        add(response, cookie(CSRF_COOKIE, csrfToken, false, SESSION_TTL));
        return csrfToken;
    }

    public void clearSession(HttpServletResponse response) {
        add(response, cookie(SESSION_COOKIE, "", true, Duration.ZERO));
        add(response, cookie(CSRF_COOKIE, "", false, Duration.ZERO));
    }

    private ResponseCookie cookie(
            String name,
            String value,
            boolean httpOnly,
            Duration maxAge
    ) {
        return ResponseCookie.from(name, value)
                .httpOnly(httpOnly)
                .secure(secure)
                .sameSite(sameSite)
                .path("/")
                .maxAge(maxAge)
                .build();
    }

    private void add(HttpServletResponse response, ResponseCookie cookie) {
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }

    private String newCsrfToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}

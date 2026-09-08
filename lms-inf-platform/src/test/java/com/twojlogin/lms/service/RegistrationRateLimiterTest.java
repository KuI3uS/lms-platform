package com.twojlogin.lms.service;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class RegistrationRateLimiterTest {

    private static final Clock CLOCK = Clock.fixed(
            Instant.parse("2026-09-08T10:00:00Z"),
            ZoneOffset.UTC
    );

    @Test
    void rejectsSixthAttemptFromTheSameIp() {
        RegistrationRateLimiter limiter = limiter();
        for (int attempt = 1; attempt <= 5; attempt++) {
            limiter.checkAndRecord("203.0.113.10", "uczen" + attempt + "@example.com");
        }

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> limiter.checkAndRecord("203.0.113.10", "kolejny@example.com")
        );

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, exception.getStatusCode());
    }

    @Test
    void rejectsFourthAttemptForTheSameEmail() {
        RegistrationRateLimiter limiter = limiter();
        for (int attempt = 1; attempt <= 3; attempt++) {
            limiter.checkAndRecord("203.0.113." + attempt, "uczen@example.com");
        }

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> limiter.checkAndRecord("203.0.113.20", "UCZEN@example.com")
        );

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, exception.getStatusCode());
    }

    @Test
    void doesNothingWhenProtectionIsDisabled() {
        RegistrationRateLimiter limiter = new RegistrationRateLimiter(
                false,
                1,
                1,
                Duration.ofMinutes(15),
                CLOCK
        );

        assertDoesNotThrow(() -> {
            limiter.checkAndRecord("203.0.113.10", "uczen@example.com");
            limiter.checkAndRecord("203.0.113.10", "uczen@example.com");
        });
    }

    private RegistrationRateLimiter limiter() {
        return new RegistrationRateLimiter(
                true,
                5,
                3,
                Duration.ofMinutes(15),
                CLOCK
        );
    }
}

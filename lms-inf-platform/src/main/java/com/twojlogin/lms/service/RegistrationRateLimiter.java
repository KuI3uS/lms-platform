package com.twojlogin.lms.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RegistrationRateLimiter {

    private final boolean enabled;
    private final int maxPerIp;
    private final int maxPerEmail;
    private final Duration window;
    private final Clock clock;
    private final Map<String, AttemptWindow> attempts = new ConcurrentHashMap<>();

    @Autowired
    public RegistrationRateLimiter(
            @Value("${registration.security.enabled:true}") boolean enabled,
            @Value("${registration.rate-limit.max-per-ip:5}") int maxPerIp,
            @Value("${registration.rate-limit.max-per-email:3}") int maxPerEmail,
            @Value("${registration.rate-limit.window-minutes:15}") long windowMinutes
    ) {
        this(enabled, maxPerIp, maxPerEmail, Duration.ofMinutes(windowMinutes), Clock.systemUTC());
    }

    RegistrationRateLimiter(
            boolean enabled,
            int maxPerIp,
            int maxPerEmail,
            Duration window,
            Clock clock
    ) {
        this.enabled = enabled;
        this.maxPerIp = Math.max(1, maxPerIp);
        this.maxPerEmail = Math.max(1, maxPerEmail);
        this.window = window.isNegative() || window.isZero() ? Duration.ofMinutes(15) : window;
        this.clock = clock;
    }

    public synchronized void checkAndRecord(String clientAddress, String email) {
        if (!enabled) return;
        Instant now = clock.instant();
        String ipKey = "ip:" + digest(normalize(clientAddress));
        String emailKey = "email:" + digest(normalize(email));

        requireAvailable(ipKey, maxPerIp, now);
        requireAvailable(emailKey, maxPerEmail, now);
        record(ipKey, now);
        record(emailKey, now);
    }

    @Scheduled(fixedDelay = 900_000)
    void removeExpiredWindows() {
        Instant threshold = clock.instant().minus(window);
        attempts.entrySet().removeIf(entry -> entry.getValue().startedAt().isBefore(threshold));
    }

    private void requireAvailable(String key, int limit, Instant now) {
        AttemptWindow current = attempts.get(key);
        if (current == null || isExpired(current, now) || current.count() < limit) return;
        long seconds = Math.max(1, Duration.between(now, current.startedAt().plus(window)).toSeconds());
        long minutes = Math.max(1, (seconds + 59) / 60);
        throw new ResponseStatusException(
                HttpStatus.TOO_MANY_REQUESTS,
                "Zbyt wiele prób rejestracji. Spróbuj ponownie za około " + minutes + " min."
        );
    }

    private void record(String key, Instant now) {
        attempts.compute(key, (ignored, current) -> {
            if (current == null || isExpired(current, now)) return new AttemptWindow(now, 1);
            return new AttemptWindow(current.startedAt(), current.count() + 1);
        });
    }

    private boolean isExpired(AttemptWindow current, Instant now) {
        return !now.isBefore(current.startedAt().plus(window));
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) return "unknown";
        return value.trim().toLowerCase(Locale.ROOT);
    }

    private String digest(String value) {
        try {
            byte[] hash = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private record AttemptWindow(Instant startedAt, int count) {
    }
}

package com.twojlogin.lms.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.IDN;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;
import java.util.zip.GZIPInputStream;

@Service
public class DisposableEmailDomainService {

    private static final Logger log = LoggerFactory.getLogger(DisposableEmailDomainService.class);
    private static final URI DOMAIN_LIST_URI = URI.create(
            "https://disposable.github.io/disposable-email-domains/domains.txt"
    );
    private static final Set<String> BUILT_IN_BLOCKED = Set.of(
            "10minemail.com",
            "10minutemail.com",
            "10minutemail.net",
            "emailondeck.com",
            "guerrillamail.com",
            "maildrop.cc",
            "mailinator.com",
            "sharklasers.com",
            "temp-mail.org",
            "tempmail.com",
            "throwawaymail.com",
            "trashmail.com",
            "yopmail.com"
    );
    private static final int MAX_LIST_CHARACTERS = 4 * 1024 * 1024;
    private static final Set<String> BUNDLED_BLOCKED = loadBundledDomains();

    private final boolean enabled;
    private final Set<String> configuredBlocked;
    private final Set<String> allowed;
    private final HttpClient httpClient;
    private final AtomicReference<Set<String>> blockedDomains = new AtomicReference<>();

    @Autowired
    public DisposableEmailDomainService(
            @Value("${registration.disposable-email.enabled:true}") boolean enabled,
            @Value("${registration.disposable-email.extra-blocked:}") String extraBlocked,
            @Value("${registration.disposable-email.allowed:}") String allowed
    ) {
        this(enabled, extraBlocked, allowed, HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build());
    }

    DisposableEmailDomainService(
            boolean enabled,
            String extraBlocked,
            String allowed,
            HttpClient httpClient
    ) {
        this.enabled = enabled;
        this.configuredBlocked = parseConfiguredDomains(extraBlocked);
        this.allowed = parseConfiguredDomains(allowed);
        this.httpClient = httpClient;
        Set<String> initialDomains = baseBlockedDomains();
        initialDomains.addAll(BUNDLED_BLOCKED);
        this.blockedDomains.set(Set.copyOf(initialDomains));
    }

    @PostConstruct
    void initialize() {
        // Pełna lokalna lista chroni od startu, także gdy źródło aktualizacji nie działa.
        log.info("Disposable email protection initialized with {} local domains", blockedDomains.get().size());
    }

    public void requirePermanentAddress(String email) {
        if (!enabled) return;
        String domain = extractDomain(email);
        if (domain == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Podaj poprawny adres email.");
        }
        if (matches(allowed, domain)) return;
        if (matches(blockedDomains.get(), domain)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tymczasowe adresy email nie są obsługiwane. Użyj stałego adresu, do którego zachowasz dostęp."
            );
        }
    }

    boolean isDisposable(String email) {
        String domain = extractDomain(email);
        return enabled && domain != null && !matches(allowed, domain)
                && matches(blockedDomains.get(), domain);
    }

    @Scheduled(initialDelay = 30_000, fixedDelay = 3_600_000)
    void refreshDomainList() {
        if (!enabled) return;
        try {
            HttpRequest request = HttpRequest.newBuilder(DOMAIN_LIST_URI)
                    .timeout(Duration.ofSeconds(10))
                    .header("Accept", "text/plain")
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
            );
            if (response.statusCode() != 200) {
                log.warn("Disposable domain refresh returned HTTP {}", response.statusCode());
                return;
            }
            String body = response.body();
            if (body == null || body.length() > MAX_LIST_CHARACTERS) {
                log.warn("Disposable domain refresh ignored because the response was invalid");
                return;
            }
            Set<String> downloaded = body.lines()
                    .map(DisposableEmailDomainService::normalizeDomain)
                    .filter(domain -> domain != null)
                    .collect(java.util.stream.Collectors.toSet());
            int minimumDomains = Math.max(100, BUNDLED_BLOCKED.size() / 2);
            if (downloaded.size() < minimumDomains) {
                log.warn("Disposable domain refresh ignored because the list was unexpectedly small");
                return;
            }
            Set<String> refreshed = baseBlockedDomains();
            refreshed.addAll(downloaded);
            blockedDomains.set(Set.copyOf(refreshed));
            log.info("Disposable email domain list refreshed: {} domains", refreshed.size());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            log.warn("Disposable domain refresh interrupted");
        } catch (Exception exception) {
            log.warn("Disposable domain refresh failed; keeping the previous list");
        }
    }

    private Set<String> baseBlockedDomains() {
        Set<String> domains = new HashSet<>(BUILT_IN_BLOCKED);
        domains.addAll(configuredBlocked);
        return domains;
    }

    private static Set<String> loadBundledDomains() {
        Set<String> domains = new HashSet<>();
        ClassPathResource resource = new ClassPathResource("registration/disposable-email-domains.txt.gz");
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                new GZIPInputStream(resource.getInputStream()), StandardCharsets.UTF_8))) {
            reader.lines().map(DisposableEmailDomainService::normalizeDomain)
                    .filter(domain -> domain != null).forEach(domains::add);
        } catch (IOException exception) {
            throw new IllegalStateException("Cannot load bundled disposable email domains", exception);
        }
        if (domains.size() < 1000) {
            throw new IllegalStateException("Bundled disposable email domain list is incomplete");
        }
        return Set.copyOf(domains);
    }

    private boolean matches(Set<String> domains, String candidate) {
        String current = candidate;
        while (current != null) {
            if (domains.contains(current)) return true;
            int dot = current.indexOf('.');
            current = dot < 0 ? null : current.substring(dot + 1);
        }
        return false;
    }

    private String extractDomain(String email) {
        if (email == null) return null;
        String address = email.trim();
        int separator = address.indexOf('@');
        if (separator <= 0 || separator != address.lastIndexOf('@')
                || separator == address.length() - 1) return null;
        return normalizeDomain(address.substring(separator + 1));
    }

    private static String normalizeDomain(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            String domain = IDN.toASCII(value.trim(), IDN.USE_STD3_ASCII_RULES).toLowerCase(Locale.ROOT);
            return domain.contains(".") && !domain.startsWith(".") && !domain.endsWith(".")
                    ? domain
                    : null;
        } catch (IllegalArgumentException exception) {
            return null;
        }
    }

    private static Set<String> parseConfiguredDomains(String value) {
        if (value == null || value.isBlank()) return Set.of();
        return Arrays.stream(value.split("[,\\s]+"))
                .map(DisposableEmailDomainService::normalizeDomain)
                .filter(domain -> domain != null)
                .collect(java.util.stream.Collectors.toUnmodifiableSet());
    }
}

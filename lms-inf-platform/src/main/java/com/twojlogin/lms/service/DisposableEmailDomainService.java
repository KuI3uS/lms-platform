package com.twojlogin.lms.service;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.IDN;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;

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
        this.blockedDomains.set(baseBlockedDomains());
    }

    @PostConstruct
    void initialize() {
        // Lista wbudowana chroni rejestrację od startu. Pełna lista jest pobierana
        // chwilę później przez zadanie cykliczne, aby nie opóźniać uruchomienia API.
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

    @Scheduled(initialDelay = 30_000, fixedDelay = 86_400_000)
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
                    HttpResponse.BodyHandlers.ofString()
            );
            if (response.statusCode() != 200) {
                log.warn("Disposable domain refresh returned HTTP {}", response.statusCode());
                return;
            }

            Set<String> refreshed = baseBlockedDomains();
            response.body().lines()
                    .map(String::trim)
                    .filter(line -> !line.isEmpty() && !line.startsWith("#"))
                    .map(this::normalizeDomain)
                    .filter(domain -> domain != null)
                    .forEach(refreshed::add);

            if (refreshed.size() < 100) {
                log.warn("Disposable domain refresh ignored because the list was unexpectedly small");
                return;
            }
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
        int separator = email.lastIndexOf('@');
        if (separator <= 0 || separator == email.length() - 1) return null;
        return normalizeDomain(email.substring(separator + 1));
    }

    private String normalizeDomain(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            String domain = IDN.toASCII(value.trim().toLowerCase(Locale.ROOT));
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
                .map(String::trim)
                .map(domain -> domain.toLowerCase(Locale.ROOT))
                .filter(domain -> !domain.isEmpty())
                .collect(java.util.stream.Collectors.toUnmodifiableSet());
    }
}

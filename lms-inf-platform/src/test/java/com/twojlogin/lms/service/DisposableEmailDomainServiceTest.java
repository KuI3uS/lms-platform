package com.twojlogin.lms.service;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.net.http.HttpClient;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DisposableEmailDomainServiceTest {

    @Test
    void blocksBuiltInDisposableDomainAndItsSubdomains() {
        DisposableEmailDomainService service = service("", "");

        assertTrue(service.isDisposable("uczen@10minemail.com"));
        assertTrue(service.isDisposable("uczen@mail.10minemail.com"));
        assertThrows(
                ResponseStatusException.class,
                () -> service.requirePermanentAddress("uczen@10minemail.com")
        );
    }

    @Test
    void acceptsOrdinaryEmailDomain() {
        DisposableEmailDomainService service = service("", "");

        assertDoesNotThrow(() -> service.requirePermanentAddress("uczen@gmail.com"));
    }

    @Test
    void supportsConfiguredBlocklistAndAllowlistOverride() {
        DisposableEmailDomainService service = service("example.test", "10minemail.com");

        assertThrows(
                ResponseStatusException.class,
                () -> service.requirePermanentAddress("uczen@example.test")
        );
        assertDoesNotThrow(() -> service.requirePermanentAddress("uczen@10minemail.com"));
    }

    private DisposableEmailDomainService service(String blocked, String allowed) {
        return new DisposableEmailDomainService(
                true,
                blocked,
                allowed,
                HttpClient.newHttpClient()
        );
    }
}

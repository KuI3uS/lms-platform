package com.twojlogin.lms.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.util.zip.GZIPInputStream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

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

    @ParameterizedTest
    @ValueSource(strings = {"gmail.com", "wp.pl", "o2.pl", "onet.pl", "interia.pl",
            "outlook.com", "hotmail.com", "yahoo.com", "icloud.com", "proton.me",
            "protonmail.com", "szkola.edu.pl", "firma.example"})
    void acceptsOrdinaryEmailDomain(String domain) {
        DisposableEmailDomainService service = service("", "");

        assertDoesNotThrow(() -> service.requirePermanentAddress("uczen@" + domain));
    }

    @ParameterizedTest
    @ValueSource(strings = {"20minute.email", "20minutemail.com", "20minutesmail.com",
            "mail.tm", "mail.gw", "tempmail.plus", "guerrillamail.net", "mohmal.com"})
    void blocksAdditionalProvidersWithoutDownloadingAnything(String domain) {
        HttpClient client = mock(HttpClient.class);
        DisposableEmailDomainService service = new DisposableEmailDomainService(true, "", "", client);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.requirePermanentAddress(" Uczen@SUB." + domain.toUpperCase() + " "));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        verifyNoInteractions(client);
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

    @Test
    void normalizesInternationalConfiguredDomainsAndKeepsExceptionsSpecific() {
        DisposableEmailDomainService service = service("POCZTA.ŻÓŁĆ.PL, other.test", "trusted.poczta.żółć.pl");

        assertThrows(ResponseStatusException.class,
                () -> service.requirePermanentAddress("uczen@sub.poczta.żółć.pl"));
        assertDoesNotThrow(() -> service.requirePermanentAddress("uczen@trusted.poczta.żółć.pl"));
        assertThrows(ResponseStatusException.class,
                () -> service.requirePermanentAddress("uczen@other.test"));
        assertDoesNotThrow(() -> service.requirePermanentAddress("uczen@notother.test"));
    }

    @Test
    void refreshAddsNewDomainsAndAllowsCorrectedDomainsWithoutLosingOverrides() throws Exception {
        HttpClient client = mock(HttpClient.class);
        DisposableEmailDomainService service = new DisposableEmailDomainService(
                true, "configured-temp.example", "allowed-temp.example", client);
        String list = bundledList().replace("\nmail.tm\n", "\n")
                + "\nnew-temp.example\nallowed-temp.example\n# comment\nnot a domain\n";
        respond(client, 200, list);

        service.refreshDomainList();

        assertTrue(service.isDisposable("uczen@new-temp.example"));
        assertTrue(service.isDisposable("uczen@configured-temp.example"));
        assertFalse(service.isDisposable("uczen@allowed-temp.example"));
        assertFalse(service.isDisposable("uczen@mail.tm"));
        assertFalse(service.isDisposable("uczen@gmail.com"));
        assertTrue(service.isDisposable("uczen@20minutemail.com"));

        // Awaria kolejnego odświeżenia nie może zgubić poprzedniej udanej aktualizacji.
        respond(client, 503, "unavailable");
        service.refreshDomainList();
        assertTrue(service.isDisposable("uczen@new-temp.example"));
    }

    @Test
    void rejectsIncompleteRefreshEvenWithALargeConfiguredBlocklist() throws Exception {
        HttpClient client = mock(HttpClient.class);
        String configured = java.util.stream.IntStream.range(0, 120)
                .mapToObj(index -> "configured-" + index + ".example")
                .collect(java.util.stream.Collectors.joining(","));
        DisposableEmailDomainService service = new DisposableEmailDomainService(true, configured, "", client);
        respond(client, 200, "new-temp.example\n<html>Error</html>\n");

        service.refreshDomainList();

        assertTrue(service.isDisposable("uczen@mail.tm"));
        assertFalse(service.isDisposable("uczen@new-temp.example"));
    }

    @Test
    void keepsLocalProtectionWhenDownloadFails() throws Exception {
        HttpClient client = mock(HttpClient.class);
        DisposableEmailDomainService service = new DisposableEmailDomainService(true, "", "", client);
        when(client.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
                .thenThrow(new IOException("offline"));

        assertDoesNotThrow(service::refreshDomainList);
        assertTrue(service.isDisposable("uczen@mail.tm"));
        assertDoesNotThrow(() -> service.requirePermanentAddress("uczen@wp.pl"));
    }

    @Test
    void disabledProtectionSkipsBlockingAndNetworkRequests() {
        HttpClient client = mock(HttpClient.class);
        DisposableEmailDomainService service = new DisposableEmailDomainService(false, "", "", client);

        service.refreshDomainList();

        assertDoesNotThrow(() -> service.requirePermanentAddress("uczen@mail.tm"));
        assertFalse(service.isDisposable("uczen@mail.tm"));
        verifyNoInteractions(client);
    }

    @ParameterizedTest
    @ValueSource(strings = {"uczen@x@mail.tm", "uczen@mail.tm.", "uczen@bad_domain.example", "uczen@", "@mail.tm"})
    void rejectsMalformedAddressesInsteadOfSkippingDomainValidation(String email) {
        assertThrows(ResponseStatusException.class, () -> service("", "").requirePermanentAddress(email));
    }

    @SuppressWarnings("unchecked")
    private void respond(HttpClient client, int status, String body) throws Exception {
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(status);
        if (status == 200) when(response.body()).thenReturn(body);
        when(client.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class))).thenReturn(response);
    }

    private String bundledList() throws IOException {
        try (var input = new GZIPInputStream(new ClassPathResource(
                "registration/disposable-email-domains.txt.gz").getInputStream())) {
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        }
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

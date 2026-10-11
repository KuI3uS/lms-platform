package com.twojlogin.lms.service;

import com.twojlogin.lms.controller.AuthController;
import com.twojlogin.lms.dto.RegisterRequest;
import com.twojlogin.lms.security.AuthCookieService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.server.ResponseStatusException;

import java.net.http.HttpClient;
import java.time.Clock;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RegistrationProtectionIntegrationTest {
    private AuthService authService;
    private AuthController controller;
    private MockHttpServletRequest servletRequest;

    @BeforeEach
    void setUp() {
        authService = mock(AuthService.class);
        RegistrationProtectionService protection = new RegistrationProtectionService(
                new RegistrationRateLimiter(true, 5, 3, Duration.ofMinutes(15), Clock.systemUTC()),
                new DisposableEmailDomainService(true, "", "", mock(HttpClient.class)));
        controller = new AuthController(authService, mock(AuthCookieService.class), protection);
        servletRequest = new MockHttpServletRequest();
        servletRequest.setRemoteAddr("203.0.113.10");
    }

    @Test
    void rejectsDisposableSignupBeforeCreatingAnAccountOrSendingEmail() {
        assertThrows(ResponseStatusException.class,
                () -> controller.register(request("uczen@20minutemail.com"), servletRequest));

        verifyNoInteractions(authService);
    }

    @Test
    void letsPermanentAddressReachNormalAccountVerification() {
        RegisterRequest request = request("uczen@wp.pl");

        controller.register(request, servletRequest);

        verify(authService).register(request);
    }

    @Test
    void blocksRepeatedSignupsUsingDifferentPermanentAddresses() {
        for (int index = 0; index < 5; index++) {
            controller.register(request("uczen" + index + "@wp.pl"), servletRequest);
        }
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> controller.register(request("kolejny@wp.pl"), servletRequest));

        assertEquals(429, error.getStatusCode().value());
        verify(authService, times(5)).register(any(RegisterRequest.class));
    }

    private RegisterRequest request(String email) {
        RegisterRequest request = new RegisterRequest();
        request.email = email;
        request.password = "test-password";
        return request;
    }
}

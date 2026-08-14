package com.twojlogin.lms.security;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthCookieServiceTest {

    @Test
    void sessionCookieIsHttpOnlySecureAndSameSite() {
        AuthCookieService service = new AuthCookieService(true, "Lax");
        MockHttpServletResponse response = new MockHttpServletResponse();

        service.issueSession(response, "signed-jwt");

        String sessionHeader = response.getHeaders("Set-Cookie").stream()
                .filter(value -> value.startsWith(AuthCookieService.SESSION_COOKIE + "="))
                .findFirst()
                .orElseThrow();
        assertTrue(sessionHeader.contains("HttpOnly"));
        assertTrue(sessionHeader.contains("Secure"));
        assertTrue(sessionHeader.contains("SameSite=Lax"));
        assertTrue(sessionHeader.contains("Path=/"));
    }

    @Test
    void csrfFilterRejectsUnsafeRequestWithoutMatchingHeader() throws Exception {
        CsrfCookieFilter filter = new CsrfCookieFilter();
        MockHttpServletRequest request = requestWithCookies();
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertEquals(403, response.getStatus());
    }

    @Test
    void csrfFilterAllowsMatchingDoubleSubmitToken() throws Exception {
        CsrfCookieFilter filter = new CsrfCookieFilter();
        MockHttpServletRequest request = requestWithCookies();
        request.addHeader(AuthCookieService.CSRF_HEADER, "csrf-value");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilter(request, response, new MockFilterChain());

        assertEquals(200, response.getStatus());
    }

    private MockHttpServletRequest requestWithCookies() {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/courses");
        request.setServletPath("/api/courses");
        request.setCookies(
                new Cookie(AuthCookieService.SESSION_COOKIE, "signed-jwt"),
                new Cookie(AuthCookieService.CSRF_COOKIE, "csrf-value")
        );
        return request;
    }
}

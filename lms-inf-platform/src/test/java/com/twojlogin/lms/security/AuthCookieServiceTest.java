package com.twojlogin.lms.security;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
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

    @Test
    void csrfBootstrapDoesNotRotateTheTokenUsedByAnotherOpenTab() throws Exception {
        AuthCookieService service = new AuthCookieService(true, "Lax");
        String token = service.issueSession(new MockHttpServletResponse(), "signed-jwt");

        for (int tab = 0; tab < 3; tab++) {
            MockHttpServletRequest bootstrap = new MockHttpServletRequest("GET", "/api/auth/csrf");
            bootstrap.setCookies(new Cookie(AuthCookieService.CSRF_COOKIE, token));
            MockHttpServletResponse response = new MockHttpServletResponse();

            assertEquals(token, service.getOrCreateCsrf(bootstrap, response));
            assertTrue(response.getHeaders("Set-Cookie").isEmpty());

            MockHttpServletRequest heartbeat = new MockHttpServletRequest("POST", "/api/learning/heartbeat");
            heartbeat.setServletPath("/api/learning/heartbeat");
            heartbeat.setCookies(new Cookie(AuthCookieService.SESSION_COOKIE, "signed-jwt"),
                    new Cookie(AuthCookieService.CSRF_COOKIE, token));
            heartbeat.addHeader(AuthCookieService.CSRF_HEADER, token);
            MockHttpServletResponse heartbeatResponse = new MockHttpServletResponse();
            new CsrfCookieFilter().doFilter(heartbeat, heartbeatResponse, new MockFilterChain());
            assertEquals(200, heartbeatResponse.getStatus());
        }
    }

    @Test
    void csrfBootstrapCreatesStrongTokenWhenTheCookieIsMissingOrMalformed() {
        AuthCookieService service = new AuthCookieService(true, "Lax");
        for (String previous : new String[]{null, "", "short", "a".repeat(44), "+".repeat(43), "_".repeat(43)}) {
            MockHttpServletRequest request = new MockHttpServletRequest();
            if (previous != null) request.setCookies(new Cookie(AuthCookieService.CSRF_COOKIE, previous));
            MockHttpServletResponse response = new MockHttpServletResponse();

            String token = service.getOrCreateCsrf(request, response);

            assertTrue(token.matches("[A-Za-z0-9_-]{43}"));
            assertNotEquals(previous, token);
            assertEquals(32, java.util.Base64.getUrlDecoder().decode(token).length);
            String cookie = response.getHeader("Set-Cookie");
            assertTrue(cookie.startsWith(AuthCookieService.CSRF_COOKIE + "=" + token));
            assertTrue(cookie.contains("Secure"));
            assertTrue(cookie.contains("SameSite=Lax"));
        }
    }

    @Test
    void loginStillRotatesCsrfTokenAndLogoutClearsBothCookies() {
        AuthCookieService service = new AuthCookieService(true, "Lax");
        String first = service.issueSession(new MockHttpServletResponse(), "first-jwt");
        MockHttpServletResponse nextLogin = new MockHttpServletResponse();
        String second = service.issueSession(nextLogin, "second-jwt");

        assertNotEquals(first, second);
        assertEquals(2, nextLogin.getHeaders("Set-Cookie").size());
        MockHttpServletResponse logout = new MockHttpServletResponse();
        service.clearSession(logout);
        assertEquals(2, logout.getHeaders("Set-Cookie").size());
        assertTrue(logout.getHeaders("Set-Cookie").stream().allMatch(cookie -> cookie.contains("Max-Age=0")));
    }

    @Test
    void mismatchingStaleTokenStillCannotWriteAfterLoginRotation() throws Exception {
        AuthCookieService service = new AuthCookieService(true, "Lax");
        String first = service.issueSession(new MockHttpServletResponse(), "first-jwt");
        String second = service.issueSession(new MockHttpServletResponse(), "second-jwt");
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/learning/heartbeat");
        request.setServletPath("/api/learning/heartbeat");
        request.setCookies(new Cookie(AuthCookieService.SESSION_COOKIE, "second-jwt"),
                new Cookie(AuthCookieService.CSRF_COOKIE, second));
        request.addHeader(AuthCookieService.CSRF_HEADER, first);
        MockHttpServletResponse response = new MockHttpServletResponse();

        new CsrfCookieFilter().doFilter(request, response, new MockFilterChain());

        assertEquals(403, response.getStatus());
        assertFalse(response.getContentAsString().isBlank());
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

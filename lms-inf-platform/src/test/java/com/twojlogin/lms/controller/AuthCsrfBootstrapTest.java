package com.twojlogin.lms.controller;

import com.twojlogin.lms.security.AuthCookieService;
import com.twojlogin.lms.service.AuthService;
import com.twojlogin.lms.service.RegistrationProtectionService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.mock;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthCsrfBootstrapTest {

    @Test
    void bootstrapReturnsExistingTokenWithoutReplacingCookiesAndCannotBeCached() throws Exception {
        AuthCookieService cookies = new AuthCookieService(true, "Lax");
        String existing = cookies.issueSession(new MockHttpServletResponse(), "session-jwt");
        var mvc = MockMvcBuilders.standaloneSetup(new AuthController(
                mock(AuthService.class), cookies, mock(RegistrationProtectionService.class))).build();

        for (int tab = 0; tab < 2; tab++) {
            mvc.perform(get("/api/auth/csrf").cookie(new Cookie(AuthCookieService.CSRF_COOKIE, existing)))
                    .andExpect(status().isOk())
                    .andExpect(header().string("Cache-Control", "no-store"))
                    .andExpect(header().doesNotExist("Set-Cookie"))
                    .andExpect(jsonPath("$.csrfToken").value(existing));
        }
    }

    @Test
    void firstBootstrapIssuesCsrfCookieWithoutIssuingAnAuthenticatedSession() throws Exception {
        AuthCookieService cookies = new AuthCookieService(true, "Lax");
        var mvc = MockMvcBuilders.standaloneSetup(new AuthController(
                mock(AuthService.class), cookies, mock(RegistrationProtectionService.class))).build();

        mvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.startsWith(AuthCookieService.CSRF_COOKIE + "=")))
                .andExpect(jsonPath("$.csrfToken").isNotEmpty());
    }
}

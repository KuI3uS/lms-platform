package com.twojlogin.lms.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class JwtServiceTest {

    @Test
    void usesConfiguredSecretAndPreservesIdentityClaims() {
        JwtService service = new JwtService(
                "0123456789012345678901234567890123456789012345678901234567890123"
        );

        String token = service.generateToken("student@example.com", "STUDENT");

        assertEquals("student@example.com", service.extractEmail(token));
        assertEquals("STUDENT", service.extractRole(token));
    }
}

package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.CourseDuplicatePreview;
import com.twojlogin.lms.service.CourseDuplicateService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@SpringJUnitConfig(CourseDuplicateControllerSecurityTest.Config.class)
class CourseDuplicateControllerSecurityTest {
    @Autowired CourseDuplicateController controller;
    @Autowired CourseDuplicateService service;

    @Test
    void anonymousUserCannotPreviewOrDelete() {
        assertThrows(AuthenticationCredentialsNotFoundException.class, () -> controller.preview(1L));
        assertThrows(AuthenticationCredentialsNotFoundException.class,
                () -> controller.cleanup(1L, new CourseDuplicateController.CleanupRequest("version")));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void studentCannotPreviewOrDelete() {
        assertThrows(AccessDeniedException.class, () -> controller.preview(1L));
        assertThrows(AccessDeniedException.class,
                () -> controller.cleanup(1L, new CourseDuplicateController.CleanupRequest("version")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminCanUseTheReviewedVersion() {
        CourseDuplicatePreview preview = new CourseDuplicatePreview("version", 1, 12, 0, List.of());
        when(service.preview(1L)).thenReturn(preview);
        when(service.cleanup(1L, "version")).thenReturn(preview);
        assertEquals(preview, controller.preview(1L));
        assertEquals(preview, controller.cleanup(1L, new CourseDuplicateController.CleanupRequest("version")));
    }

    @Configuration
    @EnableMethodSecurity
    static class Config {
        @Bean CourseDuplicateService service() { return mock(CourseDuplicateService.class); }
        @Bean CourseDuplicateController controller(CourseDuplicateService service) {
            return new CourseDuplicateController(service);
        }
    }
}

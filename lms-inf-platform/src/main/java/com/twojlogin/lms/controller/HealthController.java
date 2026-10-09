package com.twojlogin.lms.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    private static final String VERSION = "2026.10.09-stage-lesson-package-import";

    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of(
                "status", "ok",
                "version", VERSION
        );
    }
}

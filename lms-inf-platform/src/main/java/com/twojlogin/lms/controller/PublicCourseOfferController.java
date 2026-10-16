package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.PublicCourseOfferDto;
import com.twojlogin.lms.service.PublicCourseOfferService;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

@RestController
public class PublicCourseOfferController {
    private final PublicCourseOfferService service;

    public PublicCourseOfferController(PublicCourseOfferService service) {
        this.service = service;
    }

    @GetMapping("/api/public/courses/java-backend-developer")
    public ResponseEntity<PublicCourseOfferDto> javaBackendOffer() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(60, TimeUnit.SECONDS).cachePublic())
                .body(service.javaBackendOffer());
    }
}

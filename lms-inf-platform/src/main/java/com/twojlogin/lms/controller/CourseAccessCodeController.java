package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.*;
import com.twojlogin.lms.service.CourseAccessCodeService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/access-codes")
public class CourseAccessCodeController {
    private final CourseAccessCodeService service;

    public CourseAccessCodeController(CourseAccessCodeService service) {
        this.service = service;
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AccessCodeDto create(@RequestBody AccessCodeCreateRequest request) {
        return service.create(request);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public List<AccessCodeDto> all() { return service.all(); }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public AccessCodeDto revoke(@PathVariable Long id) { return service.revoke(id); }

    @PostMapping("/redeem")
    public AccessCodeRedemptionDto redeem(
            @RequestBody AccessCodeRedeemRequest request,
            Authentication authentication
    ) {
        return service.redeem(request == null ? null : request.code(), authentication);
    }
}

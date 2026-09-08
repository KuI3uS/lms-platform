package com.twojlogin.lms.service;

import org.springframework.stereotype.Service;

@Service
public class RegistrationProtectionService {

    private final RegistrationRateLimiter rateLimiter;
    private final DisposableEmailDomainService disposableEmailDomains;

    public RegistrationProtectionService(
            RegistrationRateLimiter rateLimiter,
            DisposableEmailDomainService disposableEmailDomains
    ) {
        this.rateLimiter = rateLimiter;
        this.disposableEmailDomains = disposableEmailDomains;
    }

    public void validateRegistration(String email, String clientAddress) {
        rateLimiter.checkAndRecord(clientAddress, email);
        disposableEmailDomains.requirePermanentAddress(email);
    }
}

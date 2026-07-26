package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.CertificateDto;
import com.twojlogin.lms.service.CertificateService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/certificates")
public class CertificateController {

    private final CertificateService certificateService;

    public CertificateController(CertificateService certificateService) {
        this.certificateService = certificateService;
    }

    @GetMapping("/my")
    public List<CertificateDto> mine(Authentication authentication) {
        return certificateService.mine(authentication);
    }

    @GetMapping("/verify/{certificateNumber}")
    public CertificateDto verify(@PathVariable String certificateNumber) {
        return certificateService.verify(certificateNumber);
    }
}

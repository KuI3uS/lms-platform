package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.StageExportDto;
import com.twojlogin.lms.service.StageExportService;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/modules")
public class StageExportController {
    private final StageExportService service;

    public StageExportController(StageExportService service) {
        this.service = service;
    }

    @GetMapping("/{moduleId}/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StageExportDto> export(@PathVariable Long moduleId) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore().cachePrivate())
                .header("Pragma", "no-cache")
                .body(service.export(moduleId));
    }
}

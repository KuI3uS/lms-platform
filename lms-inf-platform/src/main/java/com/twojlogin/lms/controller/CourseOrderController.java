package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.CourseOrderCreateRequest;
import com.twojlogin.lms.dto.CourseOrderDto;
import com.twojlogin.lms.service.CourseOrderService;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/course-orders")
public class CourseOrderController {

    private final CourseOrderService orderService;

    public CourseOrderController(CourseOrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping("/course/{courseId}")
    @ResponseStatus(HttpStatus.CREATED)
    public CourseOrderDto create(
            @PathVariable Long courseId,
            @RequestBody(required = false) CourseOrderCreateRequest request,
            Authentication authentication
    ) {
        return orderService.create(
                courseId,
                request == null ? null : request.requestedDiscount(),
                authentication
        );
    }

    @GetMapping("/my")
    public List<CourseOrderDto> my(Authentication authentication) {
        return orderService.myOrders(authentication);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin")
    public List<CourseOrderDto> all() {
        return orderService.allOrders();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{orderId}/confirm")
    public CourseOrderDto confirm(
            @PathVariable Long orderId,
            Authentication authentication
    ) {
        return orderService.confirm(orderId, authentication);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{orderId}/cancel")
    public CourseOrderDto cancel(@PathVariable Long orderId) {
        return orderService.cancel(orderId);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/grant")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void grant(
            @RequestParam Long userId,
            @RequestParam Long courseId
    ) {
        orderService.grantAccess(userId, courseId);
    }
}

package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.CourseOrderDto;
import com.twojlogin.lms.entity.*;
import com.twojlogin.lms.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class CourseOrderServiceTest {

    private CourseOrderRepository orderRepository;
    private CourseEnrollmentRepository enrollmentRepository;
    private CourseAccessService accessService;
    private GamificationService gamificationService;
    private CourseOrderService service;
    private Course course;
    private User student;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        CourseRepository courseRepository = mock(CourseRepository.class);
        orderRepository = mock(CourseOrderRepository.class);
        enrollmentRepository = mock(CourseEnrollmentRepository.class);
        accessService = mock(CourseAccessService.class);
        NotificationService notificationService = mock(NotificationService.class);
        gamificationService = mock(GamificationService.class);
        authentication = mock(Authentication.class);

        service = new CourseOrderService(
                courseRepository,
                orderRepository,
                enrollmentRepository,
                mock(UserRepository.class),
                accessService,
                notificationService,
                gamificationService
        );

        student = new User();
        student.setId(7L);
        student.setEmail("student@example.com");
        student.setRole(Role.STUDENT);

        course = new Course();
        course.setId(5L);
        course.setName("Java od podstaw");
        course.setPublished(true);
        course.setBillingMode(CourseBillingMode.SUBSCRIPTION);
        course.setMonthlyPrice(new BigDecimal("129.00"));
        course.setMonthlyPaymentUrl("https://payments.example/monthly");

        when(accessService.currentUser(authentication)).thenReturn(student);
        when(accessService.isAdmin(student)).thenReturn(false);
        when(accessService.isFree(course)).thenReturn(false);
        when(courseRepository.findById(5L)).thenReturn(Optional.of(course));
        when(orderRepository.save(any(CourseOrder.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(enrollmentRepository.save(any(CourseEnrollment.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(gamificationService.reserveVoucher(any(), any(), any()))
                .thenReturn(BigDecimal.ZERO.setScale(2));
    }

    @Test
    void createsMonthlyOrderUsingSubscriptionPriceAndLink() {
        when(orderRepository
                .findFirstByUserIdAndCourseIdAndStatusAndPurchaseTypeOrderByCreatedAtDesc(
                        7L, 5L, CourseOrderStatus.PENDING, CoursePurchaseType.SUBSCRIPTION
                ))
                .thenReturn(Optional.empty());

        CourseOrderDto result = service.create(
                5L,
                0,
                CoursePurchaseType.SUBSCRIPTION,
                authentication
        );

        assertEquals(CoursePurchaseType.SUBSCRIPTION, result.purchaseType());
        assertEquals(new BigDecimal("129.00"), result.amount());
        assertEquals("https://payments.example/monthly", result.paymentUrl());
    }

    @Test
    void reservesGemVoucherAndPersistsItsPercentage() {
        when(orderRepository
                .findFirstByUserIdAndCourseIdAndStatusAndPurchaseTypeOrderByCreatedAtDesc(
                        7L, 5L, CourseOrderStatus.PENDING, CoursePurchaseType.SUBSCRIPTION
                ))
                .thenReturn(Optional.empty());
        when(gamificationService.reserveVoucher(
                student,
                new BigDecimal("129.00"),
                10
        )).thenReturn(new BigDecimal("12.90"));

        CourseOrderDto result = service.create(
                5L,
                10,
                CoursePurchaseType.SUBSCRIPTION,
                authentication
        );

        assertEquals(10, result.discountPercent());
        assertEquals(new BigDecimal("12.90"), result.discountAmount());
        assertEquals(new BigDecimal("116.10"), result.amount());
        assertEquals(null, result.paymentUrl());
    }

    @Test
    void confirmationActivatesOneMonthAndDoesNotExtendTwice() {
        User admin = new User();
        admin.setId(1L);
        admin.setRole(Role.ADMIN);

        CourseOrder order = new CourseOrder();
        order.setUser(student);
        order.setCourse(course);
        order.setPurchaseType(CoursePurchaseType.SUBSCRIPTION);
        order.setStatus(CourseOrderStatus.PENDING);
        order.setAmount(new BigDecimal("129.00"));
        order.setOriginalAmount(new BigDecimal("129.00"));
        order.setDiscountAmount(BigDecimal.ZERO.setScale(2));
        order.setCurrency("PLN");
        order.setReference("EDU-TEST");
        order.setCreatedAt(LocalDateTime.now());

        when(accessService.currentUser(authentication)).thenReturn(admin);
        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));
        when(enrollmentRepository.findByUserIdAndCourseId(7L, 5L))
                .thenReturn(Optional.empty());

        LocalDateTime before = LocalDateTime.now(ZoneId.of("Europe/Warsaw")).plusMonths(1);
        CourseOrderDto first = service.confirm(10L, authentication);
        LocalDateTime firstExpiry = first.accessUntil();
        CourseOrderDto repeated = service.confirm(10L, authentication);

        assertNotNull(firstExpiry);
        assertTrue(!firstExpiry.isBefore(before.minusSeconds(2)));
        assertEquals(firstExpiry, repeated.accessUntil());
        verify(enrollmentRepository, times(1)).save(any(CourseEnrollment.class));
    }
}

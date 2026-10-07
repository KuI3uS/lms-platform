package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.CourseOrderDto;
import com.twojlogin.lms.entity.*;
import com.twojlogin.lms.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class CourseOrderService {

    private static final ZoneId WARSAW_ZONE = ZoneId.of("Europe/Warsaw");

    private final CourseRepository courseRepository;
    private final CourseOrderRepository orderRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final CourseAccessService accessService;
    private final NotificationService notificationService;
    private final GamificationService gamificationService;

    public CourseOrderService(
            CourseRepository courseRepository,
            CourseOrderRepository orderRepository,
            CourseEnrollmentRepository enrollmentRepository,
            UserRepository userRepository,
            CourseAccessService accessService,
            NotificationService notificationService,
            GamificationService gamificationService
    ) {
        this.courseRepository = courseRepository;
        this.orderRepository = orderRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
        this.accessService = accessService;
        this.notificationService = notificationService;
        this.gamificationService = gamificationService;
    }

    @Transactional
    public CourseOrderDto create(
            Long courseId,
            BigDecimal requestedDiscount,
            CoursePurchaseType requestedPurchaseType,
            Authentication authentication
    ) {
        User user = accessService.currentUser(authentication);
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Kurs nie istnieje"
                ));

        if (!course.isPublished() && !accessService.isAdmin(user)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Kurs nie istnieje");
        }

        if (accessService.isAdmin(user)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Administrator ma już pełny dostęp do kursu"
            );
        }

        CoursePurchaseType purchaseType = resolvePurchaseType(course, requestedPurchaseType);
        CourseEnrollment existingEnrollment = enrollmentRepository
                .findByUserIdAndCourseId(user.getId(), courseId)
                .orElse(null);
        if (existingEnrollment != null
                && existingEnrollment.isActive()
                && existingEnrollment.getAccessExpiresAt() == null) {
            return CourseOrderDto.from(findOrCreateAccessOrder(user, course), false);
        }

        if (accessService.isFree(course)) {
            CourseOrder order = newOrder(
                    user,
                    course,
                    BigDecimal.ZERO,
                    BigDecimal.ZERO,
                    CoursePurchaseType.ONE_TIME
            );
            order.setStatus(CourseOrderStatus.PAID);
            order.setPaidAt(now());
            CourseOrder saved = orderRepository.save(order);
            activateEnrollment(
                    user,
                    course,
                    EnrollmentSource.FREE,
                    CoursePurchaseType.ONE_TIME
            );
            notificationService.create(
                    user,
                    NotificationType.COURSE_ACCESS,
                    "Kurs został dodany",
                    "Masz już dostęp do kursu „" + courseTitle(course) + "”.",
                    "/modules/" + course.getId()
            );
            return CourseOrderDto.from(saved, false);
        }

        CourseOrder pending = orderRepository
                .findFirstByUserIdAndCourseIdAndStatusAndPurchaseTypeOrderByCreatedAtDesc(
                        user.getId(),
                        courseId,
                        CourseOrderStatus.PENDING,
                        purchaseType
                )
                .orElse(null);

        if (pending == null) {
            BigDecimal purchasePrice = purchaseType == CoursePurchaseType.SUBSCRIPTION
                    ? course.getMonthlyPrice()
                    : course.getPrice();
            BigDecimal discount = gamificationService.reserveDiscount(
                    user,
                    purchasePrice,
                    requestedDiscount
            );
            pending = orderRepository.save(newOrder(
                    user,
                    course,
                    purchasePrice,
                    discount,
                    purchaseType
            ));
        }

        return CourseOrderDto.from(pending, true);
    }

    @Transactional(readOnly = true)
    public List<CourseOrderDto> myOrders(Authentication authentication) {
        User user = accessService.currentUser(authentication);
        return orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(order -> CourseOrderDto.from(
                        order,
                        order.getStatus() == CourseOrderStatus.PENDING
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CourseOrderDto> allOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(order -> CourseOrderDto.from(order, false))
                .toList();
    }

    @Transactional
    public CourseOrderDto confirm(Long orderId, Authentication authentication) {
        User admin = accessService.currentUser(authentication);
        CourseOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Nie znaleziono zamówienia"
                ));

        if (order.getStatus() == CourseOrderStatus.CANCELLED) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Anulowanego zamówienia nie można potwierdzić"
            );
        }

        if (order.getStatus() != CourseOrderStatus.PAID) {
            order.setStatus(CourseOrderStatus.PAID);
            order.setPaidAt(now());
            order.setConfirmedBy(admin);
            CourseEnrollment enrollment = activateEnrollment(
                    order.getUser(),
                    order.getCourse(),
                    EnrollmentSource.PURCHASE,
                    order.getPurchaseType()
            );
            order.setAccessUntil(enrollment.getAccessExpiresAt());
        } else if (order.getPurchaseType() == CoursePurchaseType.ONE_TIME) {
            activateEnrollment(
                    order.getUser(),
                    order.getCourse(),
                    EnrollmentSource.PURCHASE,
                    CoursePurchaseType.ONE_TIME
            );
        }

        notificationService.create(
                order.getUser(),
                NotificationType.COURSE_ACCESS,
                "Płatność potwierdzona",
                "Odblokowaliśmy kurs „" + courseTitle(order.getCourse()) + "”.",
                "/modules/" + order.getCourse().getId()
        );

        return CourseOrderDto.from(orderRepository.save(order), false);
    }

    @Transactional
    public CourseOrderDto cancel(Long orderId) {
        CourseOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Nie znaleziono zamówienia"
                ));
        if (order.getStatus() == CourseOrderStatus.PAID) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Opłaconego zamówienia nie można anulować"
            );
        }
        if (order.getStatus() == CourseOrderStatus.CANCELLED) {
            return CourseOrderDto.from(order, false);
        }
        gamificationService.refundDiscount(
                order.getUser(),
                order.getDiscountAmount()
        );
        order.setStatus(CourseOrderStatus.CANCELLED);
        return CourseOrderDto.from(orderRepository.save(order), false);
    }

    @Transactional
    public void grantAccess(Long userId, Long courseId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Nie znaleziono użytkownika"
                ));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Nie znaleziono kursu"
                ));
        activateEnrollment(
                user,
                course,
                EnrollmentSource.ADMIN,
                CoursePurchaseType.ONE_TIME
        );
        notificationService.create(
                user,
                NotificationType.COURSE_ACCESS,
                "Przyznano dostęp do kursu",
                "Administrator odblokował kurs „" + courseTitle(course) + "”.",
                "/modules/" + course.getId()
        );
    }

    private CourseOrder findOrCreateAccessOrder(User user, Course course) {
        return orderRepository
                .findFirstByUserIdAndCourseIdAndStatusOrderByCreatedAtDesc(
                        user.getId(),
                        course.getId(),
                        CourseOrderStatus.PAID
                )
                .orElseGet(() -> {
                    CourseOrder order = newOrder(
                            user,
                            course,
                            BigDecimal.ZERO,
                            BigDecimal.ZERO,
                            CoursePurchaseType.ONE_TIME
                    );
                    order.setStatus(CourseOrderStatus.PAID);
                    order.setPaidAt(now());
                    return orderRepository.save(order);
                });
    }

    private CourseOrder newOrder(
            User user,
            Course course,
            BigDecimal originalAmount,
            BigDecimal discountAmount,
            CoursePurchaseType purchaseType
    ) {
        CourseOrder order = new CourseOrder();
        order.setReference("EDU-"
                + now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                + "-"
                + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        order.setUser(user);
        order.setCourse(course);
        BigDecimal original = originalAmount == null
                ? BigDecimal.ZERO
                : originalAmount.max(BigDecimal.ZERO);
        BigDecimal discount = discountAmount == null
                ? BigDecimal.ZERO
                : discountAmount.max(BigDecimal.ZERO).min(original);
        order.setOriginalAmount(original);
        order.setDiscountAmount(discount);
        order.setAmount(original.subtract(discount));
        order.setCurrency("PLN");
        order.setStatus(CourseOrderStatus.PENDING);
        order.setPurchaseType(purchaseType);
        order.setCreatedAt(now());
        return order;
    }

    private CourseEnrollment activateEnrollment(
            User user,
            Course course,
            EnrollmentSource source,
            CoursePurchaseType purchaseType
    ) {
        CourseEnrollment enrollment = enrollmentRepository
                .findByUserIdAndCourseId(user.getId(), course.getId())
                .orElseGet(CourseEnrollment::new);
        LocalDateTime now = now();
        enrollment.setUser(user);
        enrollment.setCourse(course);
        enrollment.setSource(source);
        enrollment.setActive(true);
        enrollment.setEnrolledAt(now);
        if (purchaseType == CoursePurchaseType.SUBSCRIPTION) {
            LocalDateTime currentExpiry = enrollment.getAccessExpiresAt();
            LocalDateTime extensionStart = currentExpiry != null && currentExpiry.isAfter(now)
                    ? currentExpiry
                    : now;
            enrollment.setAccessExpiresAt(extensionStart.plusMonths(1));
        } else {
            enrollment.setAccessExpiresAt(null);
        }
        return enrollmentRepository.save(enrollment);
    }

    private CoursePurchaseType resolvePurchaseType(
            Course course,
            CoursePurchaseType requestedPurchaseType
    ) {
        if (accessService.isFree(course)) return CoursePurchaseType.ONE_TIME;
        CoursePurchaseType purchaseType = requestedPurchaseType;
        if (purchaseType == null) {
            purchaseType = course.getBillingMode() == CourseBillingMode.SUBSCRIPTION
                    ? CoursePurchaseType.SUBSCRIPTION
                    : CoursePurchaseType.ONE_TIME;
        }
        boolean allowed = purchaseType == CoursePurchaseType.SUBSCRIPTION
                ? course.getBillingMode().allowsSubscription()
                : course.getBillingMode().allowsOneTime();
        if (!allowed) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ten sposób płatności nie jest dostępny dla kursu"
            );
        }
        return purchaseType;
    }

    private LocalDateTime now() {
        return LocalDateTime.now(WARSAW_ZONE);
    }

    private String courseTitle(Course course) {
        return course.getTitle() == null ? course.getName() : course.getTitle();
    }
}

package com.twojlogin.lms.service;

import com.stripe.StripeClient;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import com.twojlogin.lms.config.StripeProperties;
import com.twojlogin.lms.entity.CourseOrder;
import com.twojlogin.lms.entity.CourseOrderStatus;
import com.twojlogin.lms.entity.CoursePurchaseType;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.CourseOrderRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.RoundingMode;
import java.util.Locale;
import java.util.UUID;

@Service
public class StripeCheckoutService {
    private final StripeProperties properties;
    private final CourseOrderRepository orderRepository;
    private final CourseAccessService accessService;

    public StripeCheckoutService(
            StripeProperties properties,
            CourseOrderRepository orderRepository,
            CourseAccessService accessService
    ) {
        this.properties = properties;
        this.orderRepository = orderRepository;
        this.accessService = accessService;
    }

    @Transactional
    public String create(Long orderId, Authentication authentication) {
        if (!properties.checkoutConfigured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Płatności Stripe nie są jeszcze skonfigurowane");
        }
        User user = accessService.currentUser(authentication);
        CourseOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Nie znaleziono zamówienia"));
        if (!order.getUser().getId().equals(user.getId()) && !accessService.isAdmin(user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        if (order.getStatus() != CourseOrderStatus.PENDING || order.getAmount().signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Zamówienie nie oczekuje na płatność");
        }

        boolean recurring = order.getPurchaseType() == CoursePurchaseType.SUBSCRIPTION;
        SessionCreateParams.LineItem.PriceData.Builder price = SessionCreateParams.LineItem.PriceData.builder()
                .setCurrency(order.getCurrency().toLowerCase(Locale.ROOT))
                .setUnitAmount(order.getAmount().movePointRight(2).setScale(0, RoundingMode.HALF_UP).longValueExact())
                .setProductData(SessionCreateParams.LineItem.PriceData.ProductData.builder()
                        .setName(courseTitle(order))
                        .setDescription(recurring ? "Dostęp odnawiany co 30 dni" : "Dostęp przez 30 dni bez odnowienia")
                        .build());
        if (recurring) {
            price.setRecurring(SessionCreateParams.LineItem.PriceData.Recurring.builder()
                    .setInterval(SessionCreateParams.LineItem.PriceData.Recurring.Interval.MONTH)
                    .build());
        }

        String baseUrl = properties.getFrontendUrl().replaceAll("/+$", "");
        String identifier = "eduhub_" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(recurring ? SessionCreateParams.Mode.SUBSCRIPTION : SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(baseUrl + "/checkout/" + order.getCourse().getId() + "?payment=success")
                .setCancelUrl(baseUrl + "/checkout/" + order.getCourse().getId() + "?payment=cancelled")
                .setCustomerEmail(order.getUser().getEmail())
                .setClientReferenceId(order.getReference())
                .putMetadata("order_reference", order.getReference())
                .putExtraParam("integration_identifier", identifier)
                .addLineItem(SessionCreateParams.LineItem.builder()
                        .setQuantity(1L)
                        .setPriceData(price.build())
                        .build())
                .build();

        try {
            StripeClient client = new StripeClient(properties.getApiKey());
            Session session = client.v1().checkout().sessions().create(params);
            order.setStripeCheckoutSessionId(session.getId());
            orderRepository.save(order);
            return session.getUrl();
        } catch (StripeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Nie udało się uruchomić bezpiecznej płatności", exception);
        }
    }

    private String courseTitle(CourseOrder order) {
        return order.getCourse().getTitle() == null
                ? order.getCourse().getName()
                : order.getCourse().getTitle();
    }
}

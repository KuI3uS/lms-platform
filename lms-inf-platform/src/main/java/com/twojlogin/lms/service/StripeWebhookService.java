package com.twojlogin.lms.service;

import com.stripe.exception.SignatureVerificationException;
import com.stripe.model.Event;
import com.stripe.net.Webhook;
import com.twojlogin.lms.config.StripeProperties;
import com.twojlogin.lms.entity.StripeWebhookEvent;
import com.twojlogin.lms.repository.StripeWebhookEventRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.time.LocalDateTime;

@Service
public class StripeWebhookService {
    private static final ObjectMapper JSON = JsonMapper.builder().build();
    private final StripeProperties properties;
    private final StripeWebhookEventRepository eventRepository;
    private final CourseOrderService orderService;

    public StripeWebhookService(
            StripeProperties properties,
            StripeWebhookEventRepository eventRepository,
            CourseOrderService orderService
    ) {
        this.properties = properties;
        this.eventRepository = eventRepository;
        this.orderService = orderService;
    }

    @Transactional
    public void handle(String payload, String signature) {
        if (!properties.webhookConfigured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Webhook Stripe nie jest skonfigurowany");
        }
        final Event verified;
        try {
            verified = Webhook.constructEvent(payload, signature, properties.getWebhookSecret());
        } catch (SignatureVerificationException | RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Nieprawidłowy podpis Stripe", exception);
        }
        if (eventRepository.existsById(verified.getId())) return;

        JsonNode root = JSON.readTree(payload);
        JsonNode object = root.path("data").path("object");
        switch (verified.getType()) {
            case "checkout.session.completed", "checkout.session.async_payment_succeeded" -> {
                if (!"unpaid".equalsIgnoreCase(object.path("payment_status").asText(""))) {
                    String reference = object.path("client_reference_id").asText("");
                    String sessionId = object.path("id").asText("");
                    String subscriptionId = nullableText(object.path("subscription"));
                    if (!reference.isBlank()) {
                        orderService.confirmStripePayment(reference, sessionId, subscriptionId);
                    }
                }
            }
            case "invoice.paid" -> {
                if ("subscription_cycle".equals(object.path("billing_reason").asText(""))) {
                    String subscriptionId = subscriptionId(object);
                    if (subscriptionId != null) orderService.renewStripeSubscription(subscriptionId);
                }
            }
            case "invoice.payment_failed" -> {
                String subscriptionId = subscriptionId(object);
                if (subscriptionId != null) orderService.notifyStripePaymentFailed(subscriptionId);
            }
            case "customer.subscription.deleted" -> {
                String subscriptionId = nullableText(object.path("id"));
                if (subscriptionId != null) orderService.cancelStripeSubscription(subscriptionId);
            }
            default -> { }
        }

        StripeWebhookEvent processed = new StripeWebhookEvent();
        processed.setEventId(verified.getId());
        processed.setEventType(verified.getType());
        processed.setProcessedAt(LocalDateTime.now());
        eventRepository.save(processed);
    }

    private String subscriptionId(JsonNode invoice) {
        String direct = nullableText(invoice.path("subscription"));
        if (direct != null) return direct;
        return nullableText(invoice.path("parent").path("subscription_details").path("subscription"));
    }

    private String nullableText(JsonNode node) {
        if (node == null || node.isMissingNode() || node.isNull()) return null;
        String value = node.asText("").trim();
        return value.isBlank() ? null : value;
    }
}

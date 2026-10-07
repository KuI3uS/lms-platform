package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.StripeCheckoutDto;
import com.twojlogin.lms.service.StripeCheckoutService;
import com.twojlogin.lms.service.StripeWebhookService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments/stripe")
public class StripePaymentController {
    private final StripeCheckoutService checkoutService;
    private final StripeWebhookService webhookService;

    public StripePaymentController(StripeCheckoutService checkoutService, StripeWebhookService webhookService) {
        this.checkoutService = checkoutService;
        this.webhookService = webhookService;
    }

    @PostMapping("/checkout/{orderId}")
    public StripeCheckoutDto checkout(@PathVariable Long orderId, Authentication authentication) {
        return new StripeCheckoutDto(checkoutService.create(orderId, authentication));
    }

    @PostMapping("/webhook")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void webhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String signature
    ) {
        webhookService.handle(payload, signature);
    }
}

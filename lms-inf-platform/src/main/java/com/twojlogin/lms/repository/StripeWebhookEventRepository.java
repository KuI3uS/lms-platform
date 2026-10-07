package com.twojlogin.lms.repository;

import com.twojlogin.lms.entity.StripeWebhookEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StripeWebhookEventRepository extends JpaRepository<StripeWebhookEvent, String> {
}

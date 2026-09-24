package com.twojlogin.lms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "stripe_webhook_events")
public class StripeWebhookEvent {
    @Id
    @Column(length = 255)
    private String eventId;
    @Column(nullable = false, length = 100)
    private String eventType;
    @Column(nullable = false)
    private LocalDateTime processedAt;

    public String getEventId() { return eventId; }
    public void setEventId(String value) { eventId = value; }
    public String getEventType() { return eventType; }
    public void setEventType(String value) { eventType = value; }
    public LocalDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(LocalDateTime value) { processedAt = value; }
}

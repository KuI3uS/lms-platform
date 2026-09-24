package com.twojlogin.lms.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "stripe")
public class StripeProperties {
    private String apiKey = "";
    private String webhookSecret = "";
    private String frontendUrl = "https://edu-hub.com.pl";

    public boolean checkoutConfigured() { return apiKey != null && !apiKey.isBlank(); }
    public boolean webhookConfigured() { return webhookSecret != null && !webhookSecret.isBlank(); }
    public String getApiKey() { return apiKey; }
    public void setApiKey(String value) { apiKey = clean(value); }
    public String getWebhookSecret() { return webhookSecret; }
    public void setWebhookSecret(String value) { webhookSecret = clean(value); }
    public String getFrontendUrl() { return frontendUrl; }
    public void setFrontendUrl(String value) { frontendUrl = clean(value); }

    private String clean(String value) { return value == null ? "" : value.trim(); }
}

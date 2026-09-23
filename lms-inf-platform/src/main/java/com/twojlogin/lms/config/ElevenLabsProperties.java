package com.twojlogin.lms.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "elevenlabs")
public class ElevenLabsProperties {

    private String apiKey = "";
    private String femaleVoiceId = "";
    private String maleVoiceId = "";
    private String modelId = "eleven_multilingual_v2";
    private double stability = 0.50;
    private double similarityBoost = 0.75;
    private double style = 0.0;
    private double speed = 0.95;
    private boolean speakerBoost = true;

    public boolean isConfigured() {
        return !apiKey.isBlank() && !femaleVoiceId.isBlank() && !maleVoiceId.isBlank();
    }

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = value(apiKey); }
    public String getFemaleVoiceId() { return femaleVoiceId; }
    public void setFemaleVoiceId(String femaleVoiceId) { this.femaleVoiceId = value(femaleVoiceId); }
    public String getMaleVoiceId() { return maleVoiceId; }
    public void setMaleVoiceId(String maleVoiceId) { this.maleVoiceId = value(maleVoiceId); }
    public String getModelId() { return modelId; }
    public void setModelId(String modelId) { this.modelId = value(modelId); }
    public double getStability() { return stability; }
    public void setStability(double stability) { this.stability = stability; }
    public double getSimilarityBoost() { return similarityBoost; }
    public void setSimilarityBoost(double similarityBoost) { this.similarityBoost = similarityBoost; }
    public double getStyle() { return style; }
    public void setStyle(double style) { this.style = style; }
    public double getSpeed() { return speed; }
    public void setSpeed(double speed) { this.speed = speed; }
    public boolean isSpeakerBoost() { return speakerBoost; }
    public void setSpeakerBoost(boolean speakerBoost) { this.speakerBoost = speakerBoost; }

    public String voiceId(VoiceGender gender) {
        return gender == VoiceGender.FEMALE ? femaleVoiceId : maleVoiceId;
    }

    public String fingerprint() {
        return String.join("|", modelId, femaleVoiceId, maleVoiceId,
                Double.toString(stability), Double.toString(similarityBoost),
                Double.toString(style), Double.toString(speed),
                Boolean.toString(speakerBoost));
    }

    private String value(String input) {
        return input == null ? "" : input.trim();
    }
}

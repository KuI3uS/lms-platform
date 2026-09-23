package com.twojlogin.lms.service;

import com.twojlogin.lms.config.ElevenLabsProperties;
import com.twojlogin.lms.config.VoiceGender;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
public class ElevenLabsClient {

    private final ElevenLabsProperties properties;
    private final RestClient restClient;

    public ElevenLabsClient(ElevenLabsProperties properties) {
        this.properties = properties;
        this.restClient = RestClient.builder()
                .baseUrl("https://api.elevenlabs.io/v1")
                .build();
    }

    public byte[] generate(String text, VoiceGender gender) {
        Map<String, Object> voiceSettings = Map.of(
                "stability", properties.getStability(),
                "similarity_boost", properties.getSimilarityBoost(),
                "style", properties.getStyle(),
                "speed", properties.getSpeed(),
                "use_speaker_boost", properties.isSpeakerBoost()
        );
        Map<String, Object> request = Map.of(
                "text", text,
                "model_id", properties.getModelId(),
                "voice_settings", voiceSettings
        );

        return restClient.post()
                .uri(uriBuilder -> uriBuilder
                        .path("/text-to-speech/{voiceId}")
                        .queryParam("output_format", "mp3_44100_128")
                        .build(properties.voiceId(gender)))
                .header("xi-api-key", properties.getApiKey())
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.valueOf("audio/mpeg"))
                .body(request)
                .retrieve()
                .body(byte[].class);
    }
}

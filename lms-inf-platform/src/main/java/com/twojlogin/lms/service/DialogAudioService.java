package com.twojlogin.lms.service;

import com.twojlogin.lms.config.ElevenLabsProperties;
import com.twojlogin.lms.config.VoiceGender;
import com.twojlogin.lms.entity.DialogAudioCache;
import com.twojlogin.lms.repository.DialogAudioCacheRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Service
public class DialogAudioService {

    private static final int MAX_TEXT_LENGTH = 500;
    private static final int MAX_AUDIO_BYTES = 5 * 1024 * 1024;

    private final ElevenLabsProperties properties;
    private final ElevenLabsClient client;
    private final DialogAudioCacheRepository cacheRepository;

    public DialogAudioService(
            ElevenLabsProperties properties,
            ElevenLabsClient client,
            DialogAudioCacheRepository cacheRepository
    ) {
        this.properties = properties;
        this.client = client;
        this.cacheRepository = cacheRepository;
    }

    @Transactional
    public synchronized AudioResult getOrCreate(
            String text,
            String language,
            VoiceGender gender
    ) {
        String normalized = text == null ? "" : text.trim();
        if (normalized.isBlank() || normalized.length() > MAX_TEXT_LENGTH) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Wypowiedź musi mieć od 1 do 500 znaków"
            );
        }
        if (!properties.isConfigured()) {
            throw new ResponseStatusException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Naturalne głosy nie zostały jeszcze skonfigurowane"
            );
        }

        String key = hash(String.join("|",
                properties.fingerprint(),
                language == null ? "" : language,
                gender.name(),
                normalized
        ));
        return cacheRepository.findByCacheKey(key)
                .map(value -> new AudioResult(value.getAudio(), value.getContentType(), key, true))
                .orElseGet(() -> create(normalized, gender, key));
    }

    private AudioResult create(String text, VoiceGender gender, String key) {
        byte[] audio;
        try {
            audio = client.generate(text, gender);
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Nie udało się wygenerować naturalnego głosu",
                    exception
            );
        }
        if (audio == null || audio.length == 0 || audio.length > MAX_AUDIO_BYTES) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Usługa głosowa zwróciła nieprawidłowe nagranie"
            );
        }

        DialogAudioCache cached = new DialogAudioCache();
        cached.setCacheKey(key);
        cached.setContentType("audio/mpeg");
        cached.setAudio(audio);
        cached.setCreatedAt(LocalDateTime.now());
        cacheRepository.saveAndFlush(cached);
        return new AudioResult(audio, cached.getContentType(), key, false);
    }

    private String hash(String value) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256")
                            .digest(value.getBytes(StandardCharsets.UTF_8))
            );
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    public record AudioResult(byte[] bytes, String contentType, String etag, boolean cached) {}
}

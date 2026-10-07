package com.twojlogin.lms.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "dialog_audio_cache", indexes = {
        @Index(name = "idx_dialog_audio_cache_key", columnList = "cacheKey", unique = true)
})
public class DialogAudioCache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String cacheKey;

    @Column(nullable = false, length = 64)
    private String contentType = "audio/mpeg";

    @Lob
    @Column(nullable = false, columnDefinition = "LONGBLOB")
    private byte[] audio;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public String getCacheKey() { return cacheKey; }
    public void setCacheKey(String cacheKey) { this.cacheKey = cacheKey; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public byte[] getAudio() { return audio; }
    public void setAudio(byte[] audio) { this.audio = audio; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

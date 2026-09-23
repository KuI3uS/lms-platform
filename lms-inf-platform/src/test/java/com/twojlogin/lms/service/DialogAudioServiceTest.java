package com.twojlogin.lms.service;

import com.twojlogin.lms.config.ElevenLabsProperties;
import com.twojlogin.lms.config.VoiceGender;
import com.twojlogin.lms.entity.DialogAudioCache;
import com.twojlogin.lms.repository.DialogAudioCacheRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DialogAudioServiceTest {

    @Mock
    private ElevenLabsClient client;

    @Mock
    private DialogAudioCacheRepository repository;

    private ElevenLabsProperties properties;
    private DialogAudioService service;

    @BeforeEach
    void setUp() {
        properties = new ElevenLabsProperties();
        properties.setApiKey("test-key");
        properties.setFemaleVoiceId("vanessa-id");
        properties.setMaleVoiceId("jacob-id");
        service = new DialogAudioService(properties, client, repository);
    }

    @Test
    void returnsCachedAudioWithoutCallingElevenLabs() {
        DialogAudioCache cached = new DialogAudioCache();
        cached.setContentType("audio/mpeg");
        cached.setAudio(new byte[]{1, 2, 3});
        when(repository.findByCacheKey(anyString())).thenReturn(Optional.of(cached));

        DialogAudioService.AudioResult result = service.getOrCreate(
                "Good morning!", "en-GB", VoiceGender.FEMALE
        );

        assertThat(result.cached()).isTrue();
        assertThat(result.bytes()).containsExactly(1, 2, 3);
        verify(client, never()).generate(anyString(), org.mockito.ArgumentMatchers.any());
    }

    @Test
    void generatesAndStoresMissingAudio() {
        when(repository.findByCacheKey(anyString())).thenReturn(Optional.empty());
        when(client.generate("Good morning!", VoiceGender.MALE)).thenReturn(new byte[]{4, 5, 6});

        DialogAudioService.AudioResult result = service.getOrCreate(
                "Good morning!", "en-GB", VoiceGender.MALE
        );

        ArgumentCaptor<DialogAudioCache> captor = ArgumentCaptor.forClass(DialogAudioCache.class);
        verify(repository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getAudio()).containsExactly(4, 5, 6);
        assertThat(captor.getValue().getCacheKey()).hasSize(64);
        assertThat(result.cached()).isFalse();
    }

    @Test
    void rejectsRequestWhenVoicesAreNotConfigured() {
        properties.setApiKey("");

        assertThatThrownBy(() -> service.getOrCreate("Hello", "en-GB", VoiceGender.FEMALE))
                .isInstanceOfSatisfying(ResponseStatusException.class, exception ->
                        assertThat(exception.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE)
                );

        verify(repository, never()).findByCacheKey(anyString());
        verify(client, never()).generate(anyString(), org.mockito.ArgumentMatchers.any());
    }
}

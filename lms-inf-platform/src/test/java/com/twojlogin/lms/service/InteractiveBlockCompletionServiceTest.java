package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.InteractiveCompletionRequest;
import com.twojlogin.lms.entity.BlockType;
import com.twojlogin.lms.entity.GamificationProfile;
import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.entity.TaskAttempt;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.TaskAttemptRepository;
import com.twojlogin.lms.repository.GamificationProfileRepository;
import com.twojlogin.lms.repository.LessonProgressRepository;
import com.twojlogin.lms.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;

@ExtendWith(MockitoExtension.class)
class InteractiveBlockCompletionServiceTest {

    @Mock
    private TaskAttemptRepository repository;

    @Mock
    private GamificationProfileRepository profileRepository;

    private InteractiveBlockCompletionService service;
    private User user;
    private GamificationProfile profile;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(7L);
        profile = new GamificationProfile();
        profile.setUser(user);
        profile.setLevel(1);
        profile.setGemEconomyInitialized(true);
        when(profileRepository.findByUserIdForUpdate(user.getId())).thenReturn(Optional.of(profile));
        GamificationService rewards = new GamificationService(
                profileRepository, mock(LessonProgressRepository.class), repository,
                mock(UserRepository.class), mock(NotificationService.class),
                Clock.fixed(Instant.parse("2026-10-04T12:00:00Z"), ZoneId.of("Europe/Warsaw"))
        );
        service = new InteractiveBlockCompletionService(repository, rewards);
    }

    @Test
    void completesDialogAfterEveryStudentTurnWasAnswered() {
        LessonBlock block = block(BlockType.DIALOG, """
                {"studentCharacterId":"alex","turns":[
                  {"speakerId":"mia","text":"Hello"},
                  {"speakerId":"alex","text":"Hi"},
                  {"speakerId":"mia","text":"How are you?"},
                  {"speakerId":"alex","text":"Fine"}
                ]}
                """);
        when(repository.findByUserAndBlock(user, block)).thenReturn(Optional.empty());

        var result = service.complete(block, user, new InteractiveCompletionRequest(2, 72));

        assertThat(result.correct()).isTrue();
        assertThat(result.requiredItems()).isEqualTo(2);
        ArgumentCaptor<TaskAttempt> attempt = ArgumentCaptor.forClass(TaskAttempt.class);
        verify(repository).save(attempt.capture());
        assertThat(attempt.getValue().isCorrect()).isTrue();
    }

    @Test
    void requiresEveryVocabularyItem() {
        LessonBlock block = block(BlockType.VOCABULARY, """
                {"items":[{"term":"hello","translation":"cześć"},{"term":"bye","translation":"pa"}]}
                """);
        when(repository.findByUserAndBlock(user, block)).thenReturn(Optional.empty());

        var result = service.complete(block, user, new InteractiveCompletionRequest(1, 100));

        assertThat(result.correct()).isFalse();
        assertThat(result.requiredItems()).isEqualTo(2);
        assertThat(result.xpEarned()).isZero();
        assertThat(profile.getTotalXp()).isZero();
    }

    @Test
    void pronunciationAcceptsSimilarSpeechAtSixtyFivePercent() {
        LessonBlock block = block(BlockType.AUDIO, "Good morning");
        when(repository.findByUserAndBlock(user, block)).thenReturn(Optional.empty());

        var result = service.complete(block, user, new InteractiveCompletionRequest(1, 65));

        assertThat(result.correct()).isTrue();
        assertThat(result.xpEarned()).isEqualTo(10);
    }

    @Test
    void sentenceBuilderRequiresACompletelyCorrectRetry() {
        LessonBlock block = block(BlockType.SENTENCE_BUILDER, """
                {"kind":"sentence-builder","polishSentence":"Dzień dobry","words":["Good","morning"]}
                """);
        when(repository.findByUserAndBlock(user, block)).thenReturn(Optional.empty());

        var wrong = service.complete(block, user, new InteractiveCompletionRequest(0, 50));

        assertThat(wrong.correct()).isFalse();
        assertThat(wrong.requiredItems()).isEqualTo(1);
    }

    @Test
    void sentenceBuilderCompletesOnlyAtOneHundredPercent() {
        LessonBlock block = block(BlockType.SENTENCE_BUILDER, """
                {"kind":"sentence-builder","polishSentence":"Dzień dobry","words":["Good","morning"]}
                """);
        when(repository.findByUserAndBlock(user, block)).thenReturn(Optional.empty());

        var result = service.complete(block, user, new InteractiveCompletionRequest(1, 100));

        assertThat(result.correct()).isTrue();
    }

    @ParameterizedTest
    @EnumSource(value = BlockType.class, names = {"DIALOG", "VOCABULARY", "WORD_LAB", "LISTENING", "AUDIO", "SENTENCE_BUILDER"})
    void awardsConfiguredXpOnlyOnFirstCompletion(BlockType type) {
        LessonBlock block = block(type, """
                {"items":[{"term":"cat","translation":"kot"}],
                 "turns":[{"studentTurn":true,"text":"Hello"}]}
                """);
        block.setPoints(25);
        TaskAttempt attempt = new TaskAttempt();
        when(repository.findByUserAndBlock(user, block)).thenReturn(Optional.of(attempt));

        var first = service.complete(block, user, new InteractiveCompletionRequest(1, 100));
        var repeated = service.complete(block, user, new InteractiveCompletionRequest(1, 100));

        assertThat(first.correct()).isTrue();
        assertThat(first.xpEarned()).isEqualTo(25);
        assertThat(first.taskStreak()).isEqualTo(1);
        assertThat(repeated.xpEarned()).isZero();
        assertThat(repeated.taskStreak()).isEqualTo(1);
        assertThat(profile.getTotalXp()).isEqualTo(25);
        assertThat(attempt.getXpAwarded()).isEqualTo(25);
        verify(repository, times(2)).save(attempt);
    }

    @ParameterizedTest
    @EnumSource(value = BlockType.class, names = {"AUDIO", "WORD_LAB"})
    void failedPronunciationDoesNotAwardXp(BlockType type) {
        LessonBlock block = block(type, """
                {"items":[{"term":"cat","translation":"kot"}]}
                """);
        when(repository.findByUserAndBlock(user, block)).thenReturn(Optional.empty());

        var result = service.complete(block, user, new InteractiveCompletionRequest(1, 64));

        assertThat(result.correct()).isFalse();
        assertThat(result.xpEarned()).isZero();
        assertThat(profile.getTotalXp()).isZero();
    }

    @Test
    void previouslyCompletedExerciseIsNotRewardedAgain() {
        LessonBlock block = block(BlockType.AUDIO, "Hello");
        TaskAttempt attempt = new TaskAttempt();
        attempt.setCorrect(true);
        when(repository.findByUserAndBlock(user, block)).thenReturn(Optional.of(attempt));

        var result = service.complete(block, user, new InteractiveCompletionRequest(1, 100));

        assertThat(result.correct()).isTrue();
        assertThat(result.xpEarned()).isZero();
    }

    private LessonBlock block(BlockType type, String content) {
        LessonBlock block = new LessonBlock();
        block.setType(type);
        block.setContent(content);
        return block;
    }
}

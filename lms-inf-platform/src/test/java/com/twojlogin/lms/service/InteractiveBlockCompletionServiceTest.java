package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.InteractiveCompletionRequest;
import com.twojlogin.lms.entity.BlockType;
import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.entity.TaskAttempt;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.TaskAttemptRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class InteractiveBlockCompletionServiceTest {

    @Mock
    private TaskAttemptRepository repository;

    private InteractiveBlockCompletionService service;
    private User user;

    @BeforeEach
    void setUp() {
        service = new InteractiveBlockCompletionService(repository);
        user = new User();
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
    }

    @Test
    void pronunciationAcceptsSimilarSpeechAtSixtyFivePercent() {
        LessonBlock block = block(BlockType.AUDIO, "Good morning");
        when(repository.findByUserAndBlock(user, block)).thenReturn(Optional.empty());

        var result = service.complete(block, user, new InteractiveCompletionRequest(1, 65));

        assertThat(result.correct()).isTrue();
    }

    private LessonBlock block(BlockType type, String content) {
        LessonBlock block = new LessonBlock();
        block.setType(type);
        block.setContent(content);
        return block;
    }
}

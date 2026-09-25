package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.InteractiveCompletionRequest;
import com.twojlogin.lms.entity.BlockType;
import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.entity.TaskAttempt;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.TaskAttemptRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.time.LocalDateTime;

@Service
public class InteractiveBlockCompletionService {

    private static final ObjectMapper OBJECT_MAPPER = JsonMapper.builder().build();
    private static final int MIN_PRONUNCIATION_SCORE = 65;

    private final TaskAttemptRepository attemptRepository;

    public InteractiveBlockCompletionService(TaskAttemptRepository attemptRepository) {
        this.attemptRepository = attemptRepository;
    }

    @Transactional
    public CompletionResult complete(
            LessonBlock block,
            User user,
            InteractiveCompletionRequest request
    ) {
        if (block.getType() != BlockType.DIALOG
                && block.getType() != BlockType.VOCABULARY
                && block.getType() != BlockType.WORD_LAB
                && block.getType() != BlockType.SENTENCE_BUILDER
                && block.getType() != BlockType.AUDIO) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ten krok nie jest ćwiczeniem interaktywnym"
            );
        }

        int requiredItems = requiredItems(block);
        int completedItems = Math.max(0, request.completedItems() == null
                ? 0
                : request.completedItems());
        int score = Math.max(0, Math.min(100, request.score() == null
                ? 0
                : request.score()));

        boolean completed = switch (block.getType()) {
            case DIALOG, VOCABULARY, WORD_LAB -> requiredItems > 0 && completedItems >= requiredItems && (block.getType() != BlockType.WORD_LAB || score >= MIN_PRONUNCIATION_SCORE);
            case SENTENCE_BUILDER -> completedItems >= 1 && score == 100;
            case AUDIO -> completedItems >= 1 && score >= MIN_PRONUNCIATION_SCORE;
            default -> false;
        };

        TaskAttempt attempt = attemptRepository.findByUserAndBlock(user, block)
                .orElseGet(TaskAttempt::new);
        attempt.setUser(user);
        attempt.setBlock(block);
        attempt.setAttemptCount(attempt.getAttemptCount() + 1);
        attempt.setCorrect(attempt.isCorrect() || completed);
        attempt.setLastAnswer("completed=" + completedItems + "/" + requiredItems + ";score=" + score);
        attempt.setUpdatedAt(LocalDateTime.now());
        attemptRepository.save(attempt);

        String message = completed
                ? "Krok został zaliczony."
                : block.getType() == BlockType.AUDIO
                    ? "Spróbuj ponownie. Do zaliczenia wymowy potrzebujesz co najmniej 65%."
                    : "Wykonaj wszystkie elementy tego kroku.";
        return new CompletionResult(
                attempt.isCorrect(),
                requiredItems,
                completedItems,
                score,
                message
        );
    }

    private int requiredItems(LessonBlock block) {
        if (block.getType() == BlockType.AUDIO || block.getType() == BlockType.SENTENCE_BUILDER) return 1;
        try {
            JsonNode root = OBJECT_MAPPER.readTree(block.getContent());
            if (block.getType() == BlockType.VOCABULARY || block.getType() == BlockType.WORD_LAB) {
                JsonNode items = root.path("items");
                return items.isArray() ? items.size() : 0;
            }

            String studentCharacterId = root.path("studentCharacterId").asText("");
            JsonNode turns = root.path("turns");
            if (!turns.isArray()) return 0;
            int required = 0;
            for (JsonNode turn : turns) {
                if (turn.path("studentTurn").asBoolean(false)
                        || (!studentCharacterId.isBlank()
                        && studentCharacterId.equals(turn.path("speakerId").asText("")))) {
                    required += 1;
                }
            }
            return required;
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Interaktywny krok ma nieprawidłową konfigurację",
                    exception
            );
        }
    }

    public record CompletionResult(
            boolean correct,
            int requiredItems,
            int completedItems,
            int score,
            String message
    ) {}
}

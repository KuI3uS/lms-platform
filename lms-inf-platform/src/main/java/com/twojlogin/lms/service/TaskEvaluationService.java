package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.TaskCheckResponse;
import com.twojlogin.lms.dto.TaskDiagnosticDto;
import com.twojlogin.lms.entity.BlockType;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.entity.LessonProgress;
import com.twojlogin.lms.entity.TaskAttempt;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.LessonBlockRepository;
import com.twojlogin.lms.repository.LessonProgressRepository;
import com.twojlogin.lms.repository.TaskAttemptRepository;
import com.twojlogin.lms.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class TaskEvaluationService {

    private final LessonBlockRepository blockRepository;
    private final TaskAttemptRepository attemptRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final UserRepository userRepository;
    private final ProgressRewardService rewardService;

    public TaskEvaluationService(
            LessonBlockRepository blockRepository,
            TaskAttemptRepository attemptRepository,
            LessonProgressRepository lessonProgressRepository,
            UserRepository userRepository,
            ProgressRewardService rewardService
    ) {
        this.blockRepository = blockRepository;
        this.attemptRepository = attemptRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.userRepository = userRepository;
        this.rewardService = rewardService;
    }

    @Transactional
    public TaskCheckResponse check(
            Long blockId,
            String answer,
            Authentication authentication
    ) {
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Nie znaleziono użytkownika"
                ));
        LessonBlock block = blockRepository.findById(blockId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Nie znaleziono zadania"
                ));

        if (block.getType() != BlockType.TASK) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Ten blok nie jest zadaniem"
            );
        }

        if (block.getExpectedAnswer() == null || block.getExpectedAnswer().isBlank()) {
            return new TaskCheckResponse(
                    false,
                    "Nauczyciel nie skonfigurował jeszcze poprawnej odpowiedzi.",
                    0,
                    0,
                    null,
                    List.of(),
                    null,
                    false
            );
        }

        String studentAnswer = answer == null ? "" : answer;
        List<TaskDiagnosticDto> diagnostics = evaluate(
                studentAnswer,
                block.getExpectedAnswer(),
                block.getLanguage()
        );
        boolean correct = diagnostics.isEmpty();

        TaskAttempt attempt = attemptRepository.findByUserAndBlock(user, block)
                .orElseGet(TaskAttempt::new);
        attempt.setUser(user);
        attempt.setBlock(block);
        attempt.setAttemptCount(attempt.getAttemptCount() + 1);
        attempt.setCorrect(correct);
        attempt.setLastAnswer(studentAnswer);
        attempt.setUpdatedAt(LocalDateTime.now());
        attemptRepository.save(attempt);

        int hintLevel = correct ? 0 : hintLevel(attempt.getAttemptCount());
        List<TaskDiagnosticDto> visibleDiagnostics = diagnostics.stream()
                .map(diagnostic -> hintLevel == 1
                        ? new TaskDiagnosticDto(
                                diagnostic.type(),
                                diagnostic.line(),
                                diagnostic.message(),
                                null
                        )
                        : diagnostic)
                .toList();

        boolean lessonCompleted = correct && completeLessonWhenReady(user, block.getLesson());

        return new TaskCheckResponse(
                correct,
                buildMessage(correct, diagnostics),
                attempt.getAttemptCount(),
                hintLevel,
                correct ? null : buildHint(block, hintLevel, diagnostics),
                visibleDiagnostics,
                hintLevel >= 3 ? block.getExpectedAnswer() : null,
                lessonCompleted
        );
    }

    private List<TaskDiagnosticDto> evaluate(
            String student,
            String expected,
            String language
    ) {
        List<TaskDiagnosticDto> diagnostics = new ArrayList<>();
        Set<String> diagnosticKeys = new HashSet<>();

        if (student.isBlank()) {
            diagnostics.add(new TaskDiagnosticDto(
                    "EMPTY_ANSWER",
                    null,
                    "Odpowiedź jest pusta.",
                    "Uzupełnij kod zgodnie z poleceniem i spróbuj ponownie."
            ));
            return diagnostics;
        }

        addDelimiterDiagnostic(student, '{', '}', "nawiasów klamrowych", diagnostics, diagnosticKeys);
        addDelimiterDiagnostic(student, '(', ')', "nawiasów okrągłych", diagnostics, diagnosticKeys);
        addDelimiterDiagnostic(student, '[', ']', "nawiasów kwadratowych", diagnostics, diagnosticKeys);
        addQuoteDiagnostics(student, diagnostics, diagnosticKeys);

        String normalizedStudent = normalize(student);
        String[] expectedLines = expected.split("\\R");
        String[] studentLines = student.split("\\R", -1);

        for (String expectedLine : expectedLines) {
            String trimmedExpected = expectedLine.trim();

            if (shouldIgnoreExpectedLine(trimmedExpected)) {
                continue;
            }

            String normalizedExpected = normalize(trimmedExpected);
            if (normalizedStudent.contains(normalizedExpected)) {
                continue;
            }

            if (requiresSemicolon(trimmedExpected, language)) {
                String withoutSemicolon = normalize(
                        trimmedExpected.substring(0, trimmedExpected.length() - 1)
                );
                Integer line = findLine(studentLines, withoutSemicolon);

                if (line != null) {
                    addDiagnostic(
                            diagnostics,
                            diagnosticKeys,
                            new TaskDiagnosticDto(
                                    "MISSING_SEMICOLON",
                                    line,
                                    "Brakuje średnika na końcu instrukcji w linii " + line + ".",
                                    "Dodaj znak ; na końcu tej instrukcji: " + trimmedExpected
                            )
                    );
                    continue;
                }
            }

            addDiagnostic(
                    diagnostics,
                    diagnosticKeys,
                    new TaskDiagnosticDto(
                            "MISSING_REQUIRED_ELEMENT",
                            null,
                            "W rozwiązaniu brakuje wymaganego elementu: " + summarize(trimmedExpected),
                            "Porównaj strukturę swojego kodu z poleceniem i dodaj brakujący element."
                    )
            );
        }

        return diagnostics;
    }

    private void addDelimiterDiagnostic(
            String source,
            char opening,
            char closing,
            String label,
            List<TaskDiagnosticDto> diagnostics,
            Set<String> keys
    ) {
        int balance = 0;
        int firstUnexpectedClosingLine = -1;
        int line = 1;

        for (char character : source.toCharArray()) {
            if (character == '\n') line++;
            if (character == opening) balance++;
            if (character == closing) {
                balance--;
                if (balance < 0 && firstUnexpectedClosingLine < 0) {
                    firstUnexpectedClosingLine = line;
                }
            }
        }

        if (balance == 0 && firstUnexpectedClosingLine < 0) return;

        String message = balance > 0
                ? "Brakuje zamykającego znaku " + closing + " dla " + label + "."
                : "W kodzie znajduje się nadmiarowy znak " + closing + ".";
        Integer problemLine = firstUnexpectedClosingLine < 0 ? null : firstUnexpectedClosingLine;

        addDiagnostic(
                diagnostics,
                keys,
                new TaskDiagnosticDto(
                        "UNBALANCED_DELIMITER",
                        problemLine,
                        message,
                        "Sprawdź pary " + opening + closing + " i upewnij się, że każdy otwierający znak ma zamknięcie."
                )
        );
    }

    private void addQuoteDiagnostics(
            String source,
            List<TaskDiagnosticDto> diagnostics,
            Set<String> keys
    ) {
        String[] lines = source.split("\\R", -1);

        for (int index = 0; index < lines.length; index++) {
            int quoteCount = 0;
            boolean escaped = false;

            for (char character : lines[index].toCharArray()) {
                if (character == '\\' && !escaped) {
                    escaped = true;
                    continue;
                }
                if (character == '"' && !escaped) quoteCount++;
                escaped = false;
            }

            if (quoteCount % 2 != 0) {
                int lineNumber = index + 1;
                addDiagnostic(
                        diagnostics,
                        keys,
                        new TaskDiagnosticDto(
                                "UNCLOSED_STRING",
                                lineNumber,
                                "Tekst w linii " + lineNumber + " nie ma zamykającego cudzysłowu.",
                                "Dodaj brakujący znak \" zamykający tekst."
                        )
                );
            }
        }
    }

    private void addDiagnostic(
            List<TaskDiagnosticDto> diagnostics,
            Set<String> keys,
            TaskDiagnosticDto diagnostic
    ) {
        String key = diagnostic.type() + ":" + diagnostic.line() + ":" + diagnostic.message();
        if (keys.add(key)) diagnostics.add(diagnostic);
    }

    private Integer findLine(String[] lines, String normalizedFragment) {
        for (int index = 0; index < lines.length; index++) {
            if (normalize(lines[index]).equals(normalizedFragment)) {
                return index + 1;
            }
        }
        return null;
    }

    private boolean shouldIgnoreExpectedLine(String line) {
        return line.isBlank()
                || line.equals("{")
                || line.equals("}")
                || line.startsWith("//")
                || line.startsWith("/*")
                || line.startsWith("*");
    }

    private boolean requiresSemicolon(String line, String language) {
        if (!line.endsWith(";")) return false;
        if (language == null) return true;

        String normalizedLanguage = language.toLowerCase();
        return normalizedLanguage.equals("java")
                || normalizedLanguage.equals("javascript")
                || normalizedLanguage.equals("csharp");
    }

    private String normalize(String code) {
        return code
                .trim()
                .replaceAll("\\s+", "");
    }

    private String summarize(String line) {
        return line.length() <= 90 ? line : line.substring(0, 87) + "...";
    }

    private int hintLevel(int attempts) {
        if (attempts >= 4) return 3;
        if (attempts >= 2) return 2;
        return 1;
    }

    private String buildMessage(boolean correct, List<TaskDiagnosticDto> diagnostics) {
        if (correct) return "Świetnie — rozwiązanie jest poprawne.";
        if (diagnostics.size() == 1) return diagnostics.get(0).message();
        int count = diagnostics.size();
        String noun = count >= 2 && count <= 4 ? "problemy" : "problemów";
        return "Znaleziono " + count + " " + noun + " wymagających poprawy.";
    }

    private String buildHint(
            LessonBlock block,
            int level,
            List<TaskDiagnosticDto> diagnostics
    ) {
        if (level == 1) {
            return hasText(block.getHint())
                    ? block.getHint()
                    : "Przeczytaj ponownie polecenie i sprawdź składnię w zaznaczonych miejscach.";
        }

        if (level == 2) {
            if (hasText(block.getDetailedHint())) return block.getDetailedHint();
            if (!diagnostics.isEmpty() && hasText(diagnostics.get(0).suggestion())) {
                return diagnostics.get(0).suggestion();
            }
            return "Popraw kolejno wskazane problemy, zaczynając od pierwszego na liście.";
        }

        return hasText(block.getSolutionExplanation())
                ? block.getSolutionExplanation()
                : "Poniżej znajdziesz przykładowe poprawne rozwiązanie. Porównaj je linia po linii ze swoim kodem.";
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private boolean completeLessonWhenReady(User user, Lesson lesson) {
        long requiredTasks = blockRepository.countByLessonIdAndTypeAndPublishedTrue(
                lesson.getId(),
                BlockType.TASK
        );
        long correctTasks = attemptRepository.countCorrectTasksByUserAndLesson(
                user.getId(),
                lesson.getId()
        );

        if (requiredTasks == 0 || correctTasks < requiredTasks) return false;

        LessonProgress progress = lessonProgressRepository.findByUserAndLesson(user, lesson)
                .orElseGet(LessonProgress::new);
        boolean newlyCompleted = !progress.isCompleted();
        progress.setUser(user);
        progress.setLesson(lesson);
        if (!progress.isCompleted() || progress.getCompletedAt() == null) {
            progress.setCompletedAt(LocalDateTime.now());
        }
        progress.setCompleted(true);
        lessonProgressRepository.save(progress);

        if (newlyCompleted) {
            rewardService.afterLessonCompleted(user, lesson);
        }
        return newlyCompleted;
    }
}

package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.TaskCheckResponse;
import com.twojlogin.lms.dto.TaskDiagnosticDto;
import com.twojlogin.lms.entity.BlockType;
import com.twojlogin.lms.entity.GamificationProfile;
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
    private final GamificationService gamificationService;

    public TaskEvaluationService(
            LessonBlockRepository blockRepository,
            TaskAttemptRepository attemptRepository,
            LessonProgressRepository lessonProgressRepository,
            UserRepository userRepository,
            ProgressRewardService rewardService,
            GamificationService gamificationService
    ) {
        this.blockRepository = blockRepository;
        this.attemptRepository = attemptRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.userRepository = userRepository;
        this.rewardService = rewardService;
        this.gamificationService = gamificationService;
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

        return check(block, answer, user);
    }

    @Transactional
    public TaskCheckResponse check(
            LessonBlock block,
            String answer,
            User user
    ) {
        if (block.getType() != BlockType.TASK
                && block.getType() != BlockType.QUIZ) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tego bloku nie można sprawdzić automatycznie"
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
                    false,
                    0,
                    1,
                    0,
                    1,
                    false
            );
        }

        String studentAnswer = answer == null ? "" : answer;
        List<TaskDiagnosticDto> diagnostics = block.getType() == BlockType.QUIZ
                ? evaluateQuiz(studentAnswer, block.getExpectedAnswer())
                : evaluate(
                        studentAnswer,
                        block.getExpectedAnswer(),
                        block.getLanguage()
                );
        boolean correct = diagnostics.isEmpty();

        GamificationProfile profile = gamificationService.profileForUpdate(user);
        TaskAttempt attempt = attemptRepository.findByUserAndBlock(user, block)
                .orElseGet(TaskAttempt::new);
        boolean previouslyCorrect = attempt.isCorrect();
        attempt.setUser(user);
        attempt.setBlock(block);
        attempt.setAttemptCount(attempt.getAttemptCount() + 1);
        attempt.setCorrect(correct);
        attempt.setLastAnswer(studentAnswer);
        attempt.setUpdatedAt(LocalDateTime.now());
        GamificationService.AwardResult award = gamificationService.recordTaskResult(
                profile,
                block,
                attempt,
                previouslyCorrect,
                correct
        );
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
                buildMessage(block.getType(), correct, diagnostics),
                attempt.getAttemptCount(),
                hintLevel,
                correct ? null : buildHint(block, hintLevel, diagnostics),
                visibleDiagnostics,
                hintLevel >= 3 && block.getType() == BlockType.TASK
                        ? block.getExpectedAnswer()
                        : null,
                lessonCompleted,
                award.xpEarned(),
                award.multiplier(),
                award.taskStreak(),
                award.level(),
                award.levelUp()
        );
    }

    private List<TaskDiagnosticDto> evaluateQuiz(
            String student,
            String expected
    ) {
        if (student.isBlank()) {
            return List.of(new TaskDiagnosticDto(
                    "EMPTY_ANSWER",
                    null,
                    "Najpierw wybierz jedną odpowiedź.",
                    "Przeczytaj wszystkie możliwości i zaznacz tę, która najlepiej odpowiada na pytanie."
            ));
        }
        if (student.trim().equalsIgnoreCase(expected.trim())) {
            return List.of();
        }
        return List.of(new TaskDiagnosticDto(
                "INCORRECT_QUIZ_ANSWER",
                null,
                "Wybrana odpowiedź nie jest poprawna.",
                "Wróć do materiału poprzedzającego quiz i sprawdź definicję z pytania."
        ));
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
        addInvalidJavaStatementDiagnostics(
                studentLines,
                expectedLines,
                language,
                diagnostics,
                diagnosticKeys
        );

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

            addDiagnostic(diagnostics, diagnosticKeys, missingElementDiagnostic(trimmedExpected));
        }

        return diagnostics;
    }

    private void addInvalidJavaStatementDiagnostics(
            String[] studentLines,
            String[] expectedLines,
            String language,
            List<TaskDiagnosticDto> diagnostics,
            Set<String> keys
    ) {
        if (language == null || !language.equalsIgnoreCase("java")) return;

        for (int index = 0; index < studentLines.length; index++) {
            String line = studentLines[index].trim();

            if (isJavaStructureLine(line)
                    || matchesExpectedWithoutSemicolon(line, expectedLines)) {
                continue;
            }

            int lineNumber = index + 1;
            addDiagnostic(
                    diagnostics,
                    keys,
                    new TaskDiagnosticDto(
                            "INVALID_JAVA_STATEMENT",
                            lineNumber,
                            "Ta linia nie jest poprawną instrukcją Javy.",
                            "Usuń fragment „" + summarize(line)
                                    + "” albo zastąp go instrukcją realizującą polecenie."
                    )
            );
        }
    }

    private boolean isJavaStructureLine(String line) {
        if (line.isBlank()
                || line.equals("{")
                || line.equals("}")
                || line.endsWith("{")
                || line.endsWith("}")
                || line.endsWith(";")
                || line.startsWith("//")
                || line.startsWith("/*")
                || line.startsWith("*")
                || line.startsWith("@")
                || line.startsWith("package ")
                || line.startsWith("import ")) {
            return true;
        }

        if (line.endsWith(")") && (
                line.startsWith("if ")
                        || line.startsWith("if(")
                        || line.startsWith("for ")
                        || line.startsWith("for(")
                        || line.startsWith("while ")
                        || line.startsWith("while(")
                        || line.startsWith("switch ")
                        || line.startsWith("switch(")
                        || line.startsWith("catch ")
                        || line.startsWith("synchronized ")
                        || line.matches(".*\\b(public|protected|private|static|final|void)\\b.*")
        )) {
            return true;
        }

        return line.equals("else")
                || line.equals("try")
                || line.equals("do")
                || line.equals("finally")
                || line.startsWith("else ")
                || line.startsWith("catch ")
                || line.startsWith("case ")
                || line.startsWith("default:");
    }

    private boolean matchesExpectedWithoutSemicolon(
            String studentLine,
            String[] expectedLines
    ) {
        String normalizedStudentLine = normalize(studentLine);

        for (String expectedLine : expectedLines) {
            String trimmed = expectedLine.trim();
            if (!trimmed.endsWith(";")) continue;

            String withoutSemicolon = trimmed.substring(0, trimmed.length() - 1);
            if (normalize(withoutSemicolon).equals(normalizedStudentLine)) {
                return true;
            }
        }
        return false;
    }

    private TaskDiagnosticDto missingElementDiagnostic(String expectedLine) {
        if (expectedLine.contains("System.out.print")) {
            return new TaskDiagnosticDto(
                    "MISSING_OUTPUT",
                    null,
                    "Program nie wyświetla tekstu wymaganego w poleceniu.",
                    "W metodzie main użyj System.out.println(...), aby wypisać właściwy tekst."
            );
        }

        return new TaskDiagnosticDto(
                "MISSING_REQUIRED_ELEMENT",
                null,
                "Brakuje części rozwiązania wymaganej przez polecenie.",
                "Sprawdź polecenie i uzupełnij brakujący fragment programu."
        );
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

    private String buildMessage(
            BlockType type,
            boolean correct,
            List<TaskDiagnosticDto> diagnostics
    ) {
        if (type == BlockType.QUIZ) {
            return correct
                    ? "Dobrze — to poprawna odpowiedź."
                    : "Ta odpowiedź nie jest poprawna.";
        }
        if (correct) return "Świetnie — rozwiązanie jest poprawne.";
        int count = diagnostics.size();
        if (count == 1) return "Znaleziono 1 rzecz do poprawy.";
        return "Znaleziono " + count + " rzeczy do poprawy.";
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

        if (block.getType() == BlockType.QUIZ) {
            return hasText(block.getSolutionExplanation())
                    ? block.getSolutionExplanation()
                    : "Poprawna odpowiedź to: " + block.getExpectedAnswer()
                    + ". Wróć do materiału i sprawdź, dlaczego właśnie ona pasuje do pytania.";
        }

        return hasText(block.getSolutionExplanation())
                ? block.getSolutionExplanation()
                : "Poniżej znajdziesz przykładowe poprawne rozwiązanie. Porównaj je linia po linii ze swoim kodem.";
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private boolean completeLessonWhenReady(User user, Lesson lesson) {
        long requiredTasks =
                blockRepository.countRequiredAssessmentsByLessonId(
                        lesson.getId()
                );
        long correctTasks =
                attemptRepository.countCorrectAssessmentsByUserAndLesson(
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

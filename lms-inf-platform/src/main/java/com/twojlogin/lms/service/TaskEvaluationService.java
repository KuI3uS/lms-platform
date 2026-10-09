package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.TaskCheckResponse;
import com.twojlogin.lms.dto.TaskDiagnosticDto;
import com.twojlogin.lms.entity.BlockType;
import com.twojlogin.lms.entity.GamificationProfile;
import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.entity.TaskAttempt;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.LessonBlockRepository;
import com.twojlogin.lms.repository.TaskAttemptRepository;
import com.twojlogin.lms.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class TaskEvaluationService {

    private static final Pattern HTML_OPENING_TAG = Pattern.compile(
            "(?is)<([a-z][a-z0-9:-]*)\\b([^>]*)>"
    );
    private static final Pattern HTML_ATTRIBUTE = Pattern.compile(
            "(?is)([a-z_:][a-z0-9_.:-]*)(?:\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+)))?"
    );
    private static final Pattern HTML_LEAF_ELEMENT = Pattern.compile(
            "(?is)<(title|h[1-6]|p|li|button|label|a|span|strong|em)\\b[^>]*>([^<]*)</\\1\\s*>"
    );

    private final LessonBlockRepository blockRepository;
    private final TaskAttemptRepository attemptRepository;
    private final UserRepository userRepository;
    private final GamificationService gamificationService;
    private final CodeExecutionService codeExecutionService;
    private final LanguageReviewService languageReviewService;

    public TaskEvaluationService(
            LessonBlockRepository blockRepository,
            TaskAttemptRepository attemptRepository,
            UserRepository userRepository,
            GamificationService gamificationService,
            CodeExecutionService codeExecutionService,
            LanguageReviewService languageReviewService
    ) {
        this.blockRepository = blockRepository;
        this.attemptRepository = attemptRepository;
        this.userRepository = userRepository;
        this.gamificationService = gamificationService;
        this.codeExecutionService = codeExecutionService;
        this.languageReviewService = languageReviewService;
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
        if (!isCheckable(block.getType())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tego bloku nie można sprawdzić automatycznie"
            );
        }

        if (block.getType() != BlockType.PRACTICAL_LAB
                && (block.getExpectedAnswer() == null || block.getExpectedAnswer().isBlank())) {
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
        List<TaskDiagnosticDto> diagnostics = switch (block.getType()) {
            case QUIZ -> evaluateQuiz(studentAnswer, block.getExpectedAnswer());
            case PRACTICAL_LAB -> evaluateCompletionConfirmation(studentAnswer);
            case PREDICT_OUTPUT -> evaluatePredictedOutput(studentAnswer, block.getExpectedAnswer());
            case CODE_REVIEW, OPEN_RESPONSE -> evaluateReflectiveAnswer(studentAnswer);
            default -> isUnchangedStarter(studentAnswer, block.getStarterCode())
                    ? List.of(new TaskDiagnosticDto(
                        "UNCHANGED_STARTER",
                        null,
                        "Kod startowy nie został jeszcze uzupełniony.",
                        "Wykonaj polecenie w przygotowanym szablonie, a następnie sprawdź rozwiązanie ponownie."
                    ))
                    : !hasText(block.getLanguage()) && !hasText(block.getStarterCode())
                        ? evaluateTextAnswer(studentAnswer, block.getExpectedAnswer())
                        : "html".equalsIgnoreCase(block.getLanguage())
                            ? evaluateHtml(studentAnswer, block.getExpectedAnswer())
                        : hasText(block.getHiddenTests())
                                && "java".equalsIgnoreCase(block.getLanguage())
                            ? codeExecutionService.evaluateJava(
                                    studentAnswer,
                                    block.getHiddenTests()
                            )
                        : evaluate(
                            studentAnswer,
                            block.getExpectedAnswer(),
                            block.getLanguage()
                        );
        };
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
        languageReviewService.record(user, block, correct ? 100 : 35);

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

        return new TaskCheckResponse(
                correct,
                buildMessage(block.getType(), correct, diagnostics),
                attempt.getAttemptCount(),
                hintLevel,
                correct ? null : buildHint(block, hintLevel, diagnostics),
                visibleDiagnostics,
                solutionPreview(block, correct, hintLevel),
                false,
                award.xpEarned(),
                award.multiplier(),
                award.taskStreak(),
                award.level(),
                award.levelUp()
        );
    }

    private boolean isCheckable(BlockType type) {
        return type == BlockType.TASK
                || type == BlockType.QUIZ
                || type == BlockType.PRACTICAL_LAB
                || type == BlockType.DEBUGGING
                || type == BlockType.PREDICT_OUTPUT
                || type == BlockType.CODE_REVIEW
                || type == BlockType.OPEN_RESPONSE;
    }

    private String solutionPreview(LessonBlock block, boolean correct, int hintLevel) {
        if ((block.getType() == BlockType.CODE_REVIEW
                || block.getType() == BlockType.OPEN_RESPONSE)
                && correct) {
            return block.getExpectedAnswer();
        }

        if (!correct && hintLevel >= 3 && block.getType() != BlockType.PRACTICAL_LAB) {
            return block.getExpectedAnswer();
        }

        return null;
    }

    private List<TaskDiagnosticDto> evaluateCompletionConfirmation(String student) {
        if (!student.isBlank()) return List.of();
        return List.of(new TaskDiagnosticDto(
                "COMPLETION_NOT_CONFIRMED",
                null,
                "Najpierw wykonaj wszystkie kroki laboratorium.",
                "Sprawdź rezultat według listy weryfikacyjnej, a następnie potwierdź ukończenie."
        ));
    }

    private List<TaskDiagnosticDto> evaluateReflectiveAnswer(String student) {
        if (!student.isBlank()) return List.of();
        return List.of(new TaskDiagnosticDto(
                "EMPTY_ANSWER",
                null,
                "Najpierw zapisz własną odpowiedź.",
                "Odnieś się do kryteriów z polecenia. Po wysłaniu zobaczysz model odpowiedzi do samooceny."
        ));
    }

    private List<TaskDiagnosticDto> evaluatePredictedOutput(String student, String expected) {
        if (student.isBlank()) {
            return List.of(new TaskDiagnosticDto(
                    "EMPTY_ANSWER",
                    null,
                    "Najpierw wpisz przewidywany wynik programu.",
                    "Prześledź wykonanie kodu krok po kroku, zanim go uruchomisz."
            ));
        }

        if (normalizeProgramOutput(student).equals(normalizeProgramOutput(expected))) {
            return List.of();
        }

        return List.of(new TaskDiagnosticDto(
                "INCORRECT_PREDICTED_OUTPUT",
                null,
                "Przewidywany wynik nie zgadza się jeszcze z wynikiem programu.",
                "Zapisuj po kolei zmiany wartości zmiennych i każdą linię, którą wypisuje program."
        ));
    }

    private String normalizeProgramOutput(String output) {
        return String.valueOf(output == null ? "" : output)
                .replace("\r\n", "\n")
                .replace('\r', '\n')
                .lines()
                .map(String::stripTrailing)
                .reduce((left, right) -> left + "\n" + right)
                .orElse("")
                .strip();
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

    private List<TaskDiagnosticDto> evaluateTextAnswer(
            String student,
            String expected
    ) {
        if (student.isBlank()) {
            return List.of(new TaskDiagnosticDto(
                    "EMPTY_ANSWER",
                    null,
                    "Najpierw wpisz odpowiedź.",
                    "Wróć do materiału lekcji i spróbuj ułożyć krótką odpowiedź."
            ));
        }

        String normalizedStudent = normalizeTextAnswer(student);
        boolean matches = Arrays.stream(expected.split("\\|"))
                .map(this::normalizeTextAnswer)
                .filter(candidate -> !candidate.isBlank())
                .anyMatch(normalizedStudent::equals);
        if (matches) return List.of();

        return List.of(new TaskDiagnosticDto(
                "INCORRECT_TEXT_ANSWER",
                null,
                "Ta odpowiedź nie pasuje jeszcze do żadnej poprawnej wersji.",
                "Sprawdź szyk zdania, potrzebne słowo i pisownię. Wielkość liter oraz końcowa interpunkcja nie mają znaczenia."
        ));
    }

    private String normalizeTextAnswer(String answer) {
        return answer
                .trim()
                .toLowerCase(Locale.ROOT)
                .replaceAll("[.!?,;:]+$", "")
                .replaceAll("\\s+", " ");
    }

    private List<TaskDiagnosticDto> evaluateHtml(String student, String expected) {
        if (student.isBlank()) {
            return List.of(new TaskDiagnosticDto(
                    "EMPTY_ANSWER",
                    null,
                    "Kod HTML jest pusty.",
                    "Utwórz dokument zgodnie z wymaganiami i sprawdź go ponownie."
            ));
        }

        List<TaskDiagnosticDto> diagnostics = new ArrayList<>();
        Set<String> keys = new HashSet<>();

        if (containsHtmlDoctype(expected) && !containsHtmlDoctype(student)) {
            addDiagnostic(diagnostics, keys, new TaskDiagnosticDto(
                    "MISSING_HTML_DOCTYPE",
                    1,
                    "Brakuje deklaracji dokumentu HTML5.",
                    "Dodaj deklarację <!DOCTYPE html> na początku dokumentu."
            ));
        }

        Map<String, List<String>> expectedTags = htmlOpeningTags(expected);
        Map<String, List<String>> studentTags = htmlOpeningTags(student);

        expectedTags.forEach((tag, expectedOccurrences) -> {
            List<String> studentOccurrences = studentTags.getOrDefault(tag, List.of());
            if (studentOccurrences.size() < expectedOccurrences.size()) {
                int missing = expectedOccurrences.size() - studentOccurrences.size();
                addDiagnostic(diagnostics, keys, new TaskDiagnosticDto(
                        "MISSING_HTML_ELEMENT",
                        null,
                        "Brakuje " + htmlElementLabel(tag, missing) + ".",
                        "Dodaj wymagany element <" + tag + "> w odpowiedniej części dokumentu."
                ));
            }

            Map<String, String> requiredAttributes = new LinkedHashMap<>();
            expectedOccurrences.forEach(attributes ->
                    requiredAttributes.putAll(htmlAttributes(attributes))
            );
            requiredAttributes.forEach((attribute, expectedValue) -> {
                boolean present = studentOccurrences.stream()
                        .map(this::htmlAttributes)
                        .anyMatch(attributes -> attributes.containsKey(attribute)
                                && normalizeHtmlText(attributes.get(attribute))
                                .equals(normalizeHtmlText(expectedValue)));
                if (!present) {
                    Integer line = findHtmlTagLine(student, tag);
                    String formattedValue = expectedValue.isBlank()
                            ? attribute
                            : attribute + "=\"" + expectedValue + "\"";
                    addDiagnostic(diagnostics, keys, new TaskDiagnosticDto(
                            "MISSING_HTML_ATTRIBUTE",
                            line,
                            "Element <" + tag + "> nie ma wymaganego atrybutu " + formattedValue + ".",
                            "Uzupełnij znacznik <" + tag + "> o atrybut " + formattedValue + "."
                    ));
                }
            });

            long expectedClosings = htmlClosingTagCount(expected, tag);
            long studentClosings = htmlClosingTagCount(student, tag);
            if (expectedClosings > 0 && studentClosings < Math.min(expectedClosings, studentOccurrences.size())) {
                addDiagnostic(diagnostics, keys, new TaskDiagnosticDto(
                        "UNCLOSED_HTML_ELEMENT",
                        findHtmlTagLine(student, tag),
                        "Element <" + tag + "> nie został prawidłowo zamknięty.",
                        "Dodaj brakujący znacznik </" + tag + ">."
                ));
            }
        });

        Map<String, List<String>> expectedText = htmlLeafText(expected);
        Map<String, List<String>> studentText = htmlLeafText(student);
        expectedText.forEach((tag, expectedValues) -> {
            List<String> actualValues = studentText.getOrDefault(tag, List.of());
            for (int index = 0; index < expectedValues.size(); index++) {
                if (index >= actualValues.size()) continue;

                String expectedValue = expectedValues.get(index);
                String actualValue = actualValues.get(index);
                if (!normalizeHtmlText(actualValue).equals(normalizeHtmlText(expectedValue))) {
                    addDiagnostic(diagnostics, keys, new TaskDiagnosticDto(
                            "INCORRECT_HTML_CONTENT",
                            findHtmlTagLine(student, tag, index),
                            "Element <" + tag + "> nie zawiera wymaganej treści: „" + expectedValue.trim() + "”.",
                            "Sprawdź treść wewnątrz znacznika <" + tag + ">. Wielkość liter i odstępy nie mają znaczenia."
                    ));
                }
            }
        });

        return diagnostics;
    }

    private boolean containsHtmlDoctype(String html) {
        return Pattern.compile("(?is)<!doctype\\s+html\\s*>")
                .matcher(html == null ? "" : html)
                .find();
    }

    private Map<String, List<String>> htmlOpeningTags(String html) {
        Map<String, List<String>> tags = new LinkedHashMap<>();
        Matcher matcher = HTML_OPENING_TAG.matcher(html == null ? "" : html);
        while (matcher.find()) {
            String tag = matcher.group(1).toLowerCase(Locale.ROOT);
            tags.computeIfAbsent(tag, ignored -> new ArrayList<>()).add(matcher.group(2));
        }
        return tags;
    }

    private Map<String, String> htmlAttributes(String source) {
        Map<String, String> attributes = new LinkedHashMap<>();
        Matcher matcher = HTML_ATTRIBUTE.matcher(source == null ? "" : source);
        while (matcher.find()) {
            String name = matcher.group(1).toLowerCase(Locale.ROOT);
            String value = matcher.group(2) != null ? matcher.group(2)
                    : matcher.group(3) != null ? matcher.group(3)
                    : matcher.group(4) != null ? matcher.group(4)
                    : "";
            attributes.put(name, value);
        }
        return attributes;
    }

    private Map<String, List<String>> htmlLeafText(String html) {
        Map<String, List<String>> values = new LinkedHashMap<>();
        Matcher matcher = HTML_LEAF_ELEMENT.matcher(html == null ? "" : html);
        while (matcher.find()) {
            String tag = matcher.group(1).toLowerCase(Locale.ROOT);
            values.computeIfAbsent(tag, ignored -> new ArrayList<>()).add(matcher.group(2));
        }
        return values;
    }

    private long htmlClosingTagCount(String html, String tag) {
        return Pattern.compile("(?is)</\\s*" + Pattern.quote(tag) + "\\s*>")
                .matcher(html == null ? "" : html)
                .results()
                .count();
    }

    private Integer findHtmlTagLine(String html, String tag) {
        return findHtmlTagLine(html, tag, 0);
    }

    private Integer findHtmlTagLine(String html, String tag, int occurrence) {
        Matcher matcher = Pattern.compile("(?is)<\\s*" + Pattern.quote(tag) + "\\b")
                .matcher(html == null ? "" : html);
        for (int index = 0; index <= occurrence; index++) {
            if (!matcher.find()) return null;
        }
        return (int) (html.substring(0, matcher.start()).chars().filter(character -> character == '\n').count() + 1);
    }

    private String normalizeHtmlText(String value) {
        return String.valueOf(value == null ? "" : value)
                .replaceAll("\\s+", " ")
                .trim()
                .toLowerCase(Locale.ROOT);
    }

    private String htmlElementLabel(String tag, int count) {
        if (count == 1) return "elementu <" + tag + ">";
        return count + " elementów <" + tag + ">";
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

        if (isCommentOnlySolution(expected)) {
            return evaluateCommentTask(student, expected);
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

    private boolean isUnchangedStarter(String student, String starter) {
        return hasText(starter) && normalize(student).equals(normalize(starter));
    }

    private boolean isCommentOnlySolution(String expected) {
        List<String> meaningfulLines = Arrays.stream(expected.split("\\R"))
                .map(String::trim)
                .filter(line -> !line.isBlank())
                .toList();

        return !meaningfulLines.isEmpty()
                && meaningfulLines.stream().allMatch(this::isCommentLine);
    }

    private List<TaskDiagnosticDto> evaluateCommentTask(
            String student,
            String expected
    ) {
        List<String> expectedComments = Arrays.stream(expected.split("\\R"))
                .map(this::commentBody)
                .filter(body -> !body.isBlank())
                .toList();
        List<String> studentComments = Arrays.stream(student.split("\\R"))
                .map(String::trim)
                .filter(this::isCommentLine)
                .map(this::commentBody)
                .filter(body -> !body.isBlank())
                .toList();
        List<TaskDiagnosticDto> diagnostics = new ArrayList<>();

        if (studentComments.size() != expectedComments.size()) {
            diagnostics.add(new TaskDiagnosticDto(
                    "INCORRECT_COMMENT_COUNT",
                    null,
                    "Rozwiązanie powinno zawierać dokładnie "
                            + expectedComments.size()
                            + " komentarze, a zawiera "
                            + studentComments.size()
                            + ".",
                    "Usuń dodatkowe komentarze albo dopisz brakujące tak, aby ich liczba zgadzała się z poleceniem."
            ));
        }

        for (String expectedComment : expectedComments) {
            String expectedLabel = commentLabel(expectedComment);
            String normalizedLabel = normalizeCommentText(expectedLabel);
            String matchingComment = studentComments.stream()
                    .filter(comment -> normalizeCommentText(commentLabel(comment))
                            .equals(normalizedLabel))
                    .findFirst()
                    .orElse(null);

            if (matchingComment == null) {
                diagnostics.add(new TaskDiagnosticDto(
                        "MISSING_REQUIRED_COMMENT",
                        null,
                        "Brakuje wymaganego komentarza: " + expectedLabel + ".",
                        "Dodaj komentarz zaczynający się od „// "
                                + expectedLabel
                                + ":” i opisz ten etap własnymi słowami."
                ));
                continue;
            }

            if (expectedComment.contains(":")
                    && (!matchingComment.contains(":")
                    || matchingComment.substring(matchingComment.indexOf(':') + 1).isBlank())) {
                diagnostics.add(new TaskDiagnosticDto(
                        "MISSING_REQUIRED_COMMENT",
                        null,
                        "Komentarz „" + expectedLabel + "” nie zawiera opisu.",
                        "Po dwukropku dopisz krótki, konkretny opis tego etapu."
                ));
            }
        }

        return diagnostics;
    }

    private boolean isCommentLine(String line) {
        String trimmed = line.trim();
        return trimmed.startsWith("//")
                || trimmed.startsWith("/*")
                || trimmed.startsWith("*")
                || trimmed.endsWith("*/");
    }

    private String commentBody(String line) {
        return line.trim()
                .replaceFirst("^/[/\\*]\\s*", "")
                .replaceFirst("^\\*\\s*", "")
                .replaceFirst("\\s*\\*/$", "")
                .trim();
    }

    private String commentLabel(String comment) {
        int separator = comment.indexOf(':');
        return (separator >= 0 ? comment.substring(0, separator) : comment).trim();
    }

    private String normalizeCommentText(String value) {
        return value.toLowerCase(Locale.ROOT)
                .replaceAll("[^\\p{L}\\p{N}]", "");
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
                || normalizedLanguage.equals("csharp")
                || normalizedLanguage.equals("sql");
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
        if (type == BlockType.PRACTICAL_LAB) {
            return correct
                    ? "Laboratorium ukończone — możesz przejść dalej."
                    : "Dokończ laboratorium i sprawdź rezultat.";
        }
        if (type == BlockType.CODE_REVIEW || type == BlockType.OPEN_RESPONSE) {
            return correct
                    ? "Odpowiedź zapisana. Porównaj ją z modelem i kryteriami samooceny."
                    : "Najpierw zapisz własną odpowiedź.";
        }
        if (type == BlockType.PREDICT_OUTPUT) {
            return correct
                    ? "Dobrze — przewidziany wynik jest poprawny."
                    : "Prześledź kod jeszcze raz.";
        }
        if (type == BlockType.DEBUGGING) {
            return correct
                    ? "Dobra robota — błąd został naprawiony."
                    : "Program nadal zawiera elementy wymagające poprawy.";
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

}

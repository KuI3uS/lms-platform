package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.TaskDiagnosticDto;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/** Compares SQL requirements without executing learner code against any database. */
final class SqlTaskEvaluator {
    private SqlTaskEvaluator() {}

    static List<TaskDiagnosticDto> evaluate(String student, String expected) {
        ParsedSql reference = parse(expected);
        if (!reference.diagnostics().isEmpty() || reference.statements().isEmpty()) {
            return List.of(new TaskDiagnosticDto(
                    "SQL_REFERENCE_ERROR", null,
                    "Wzorzec SQL wymaga poprawy przez nauczyciela.",
                    "Sprawdź poprawną odpowiedź w edytorze zadania."
            ));
        }
        ParsedSql submitted = parse(student);
        if (!submitted.diagnostics().isEmpty()) return submitted.diagnostics();
        if (submitted.statements().isEmpty()) {
            return List.of(new TaskDiagnosticDto(
                    "EMPTY_ANSWER", null, "Najpierw wpisz rozwiązanie SQL.",
                    "Komentarze nie zastępują instrukcji tworzących bazę, tabelę i rekordy."
            ));
        }

        List<Statement> requirements = expandInserts(reference.statements());
        List<Statement> answers = expandInserts(submitted.statements());
        Set<Integer> used = new HashSet<>();
        List<TaskDiagnosticDto> diagnostics = new ArrayList<>();
        List<Integer> matchedPositions = new ArrayList<>();

        // Match complete requirements first, so a wrong record cannot consume a valid one.
        List<Statement> missing = new ArrayList<>();
        for (Statement required : requirements) {
            int exact = findMatch(answers, used, required, true);
            if (exact >= 0) {
                used.add(exact);
                matchedPositions.add(exact);
            } else {
                missing.add(required);
            }
        }
        for (Statement required : missing) {
            int similar = findMatch(answers, used, required, false);
            if (similar >= 0) {
                used.add(similar);
                Statement actual = answers.get(similar);
                diagnostics.add(new TaskDiagnosticDto(
                        "INCORRECT_SQL_STATEMENT", firstDifferentLine(actual, required),
                        "Sprawdź " + required.label() + ": struktura lub dane różnią się od wymagań.",
                        required.isInsert()
                                ? "Sprawdź wartości rekordu i ich przypisanie do kolumn. Tekst w cudzysłowach musi odpowiadać danym z polecenia."
                                : "Sprawdź nazwę obiektu, wymagane kolumny i typy. Oddziel kolejne instrukcje średnikami."
                ));
            } else {
                diagnostics.add(new TaskDiagnosticDto(
                        "MISSING_SQL_STATEMENT", null,
                        "Brakuje instrukcji realizującej " + required.label() + ".",
                        "Dodaj ten element zgodnie z poleceniem."
                ));
            }
        }

        for (int index = 0; index < answers.size(); index++) {
            if (used.contains(index)) continue;
            Statement extra = answers.get(index);
            if (isOptionalTablePreview(extra, answers, index)) continue;
            diagnostics.add(new TaskDiagnosticDto(
                    "UNEXPECTED_SQL_STATEMENT", extra.line(),
                    "Dodatkowa instrukcja lub rekord nie pasuje do wymagań zadania.",
                    "Sprawdź, czy nie dodano zbędnego rekordu, powtórzonej operacji albo instrukcji zmieniającej wymagany rezultat."
            ));
        }

        if (diagnostics.isEmpty()) {
            for (int index = 1; index < matchedPositions.size(); index++) {
                int previous = matchedPositions.get(index - 1);
                int current = matchedPositions.get(index);
                // The order of rows in INSERT is immaterial, but setup must precede use.
                if (current < previous && !(requirements.get(index - 1).isInsert()
                        && requirements.get(index).isInsert()
                        && requirements.get(index - 1).key().equals(requirements.get(index).key()))) {
                    diagnostics.add(new TaskDiagnosticDto(
                            "SQL_STATEMENT_ORDER", answers.get(current).line(),
                            "Kolejność instrukcji SQL nie pozwala wykonać zadania zgodnie z wzorcem.",
                            "Najpierw utwórz bazę i wybierz ją, następnie utwórz tabelę i dodaj rekordy."
                    ));
                    break;
                }
            }
        }
        return diagnostics;
    }

    private static int findMatch(List<Statement> answers, Set<Integer> used,
                                 Statement required, boolean exact) {
        for (int index = 0; index < answers.size(); index++) {
            if (used.contains(index)) continue;
            Statement candidate = answers.get(index);
            if (exact ? candidate.values().equals(required.values())
                    : candidate.key().equals(required.key())) return index;
        }
        return -1;
    }

    private static int firstDifferentLine(Statement actual, Statement expected) {
        for (int index = 0; index < Math.min(actual.tokens().size(), expected.tokens().size()); index++) {
            if (!actual.tokens().get(index).value().equals(expected.tokens().get(index).value())) {
                return actual.tokens().get(index).line();
            }
        }
        return actual.tokens().get(actual.tokens().size() - 1).line();
    }

    private static boolean isOptionalTablePreview(Statement statement, List<Statement> answers, int index) {
        List<String> values = statement.values();
        return values.size() == 4 && values.get(0).equals("select")
                && values.get(1).equals("*") && values.get(2).equals("from")
                && answers.subList(0, index).stream().anyMatch(required -> required.key().equals("create table " + values.get(3)));
    }

    private static List<Statement> expandInserts(List<Statement> statements) {
        List<Statement> result = new ArrayList<>();
        for (Statement statement : statements) {
            List<Token> tokens = statement.tokens();
            int valuesIndex = -1;
            if (statement.isInsert()) {
                for (int index = 3; index < tokens.size(); index++) {
                    if (tokens.get(index).value().equals("values")) {
                        valuesIndex = index;
                        break;
                    }
                }
            }
            if (valuesIndex < 0) {
                result.add(statement);
                continue;
            }
            List<Statement> rows = new ArrayList<>();
            int position = valuesIndex + 1;
            while (position < tokens.size() && tokens.get(position).value().equals("(")) {
                int start = position;
                int depth = 0;
                do {
                    String value = tokens.get(position++).value();
                    if (value.equals("(")) depth++;
                    if (value.equals(")")) depth--;
                } while (position < tokens.size() && depth > 0);
                List<Token> row = new ArrayList<>(tokens.subList(0, valuesIndex + 1));
                row.addAll(tokens.subList(start, position));
                rows.add(new Statement(row));
                if (position < tokens.size() && tokens.get(position).value().equals(",")) {
                    position++;
                    if (position == tokens.size()) break;
                } else {
                    break;
                }
            }
            // Do not discard suffixes (e.g. ON DUPLICATE KEY) or malformed separators.
            boolean trailingComma = !tokens.isEmpty() && tokens.get(tokens.size() - 1).value().equals(",");
            if (position == tokens.size() && !rows.isEmpty() && !trailingComma) result.addAll(rows);
            else result.add(statement);
        }
        return result;
    }

    private static ParsedSql parse(String source) {
        String sql = source == null ? "" : source.replace("\r\n", "\n").replace('\r', '\n');
        // Imports sometimes retain an outer Markdown code fence in the answer field.
        String stripped = sql.strip();
        if (stripped.matches("(?s)^```(?i:sql|mysql|mariadb)?\\s*\\R.*\\R```$")) {
            int opening = sql.indexOf('\n', sql.indexOf("```"));
            int closing = sql.lastIndexOf("```");
            sql = sql.substring(0, opening + 1).replaceAll("[^\\r\\n]", " ")
                    + sql.substring(opening + 1, closing);
        }
        List<Statement> statements = new ArrayList<>();
        List<Token> tokens = new ArrayList<>();
        List<Integer> parentheses = new ArrayList<>();
        int line = 1;
        for (int index = 0; index < sql.length();) {
            char character = sql.charAt(index);
            if (Character.isWhitespace(character) || Character.isSpaceChar(character)) {
                if (character == '\n') line++;
                index++;
                continue;
            }
            if (character == '#' || (character == '-' && index + 2 < sql.length()
                    && sql.charAt(index + 1) == '-' && (Character.isWhitespace(sql.charAt(index + 2))
                    || Character.isSpaceChar(sql.charAt(index + 2))))) {
                while (index < sql.length() && sql.charAt(index) != '\n') index++;
                continue;
            }
            if (character == '/' && index + 1 < sql.length() && sql.charAt(index + 1) == '*') {
                int startLine = line;
                int end = sql.indexOf("*/", index + 2);
                if (end < 0) return syntaxError(startLine, "Nie zamknięto komentarza SQL.", "Zamknij komentarz znakiem */.");
                // MySQL executable comments are code, not harmless formatting.
                if (index + 2 < sql.length() && (sql.charAt(index + 2) == '!'
                        || sql.startsWith("M!", index + 2))) {
                    return syntaxError(startLine, "Komentarz wykonujący instrukcje SQL wymaga jawnego zapisu.",
                            "Wpisz wymagane instrukcje jako zwykły SQL.");
                }
                for (int offset = index; offset < end + 2; offset++) {
                    if (sql.charAt(offset) == '\n') line++;
                }
                index = end + 2;
                continue;
            }
            if (character == '\'' || character == '"' || character == '`') {
                char quote = character;
                int startLine = line;
                StringBuilder value = new StringBuilder();
                boolean closed = false;
                index++;
                while (index < sql.length()) {
                    char next = sql.charAt(index++);
                    if (next == '\n') line++;
                    if (next == quote) {
                        if (index < sql.length() && sql.charAt(index) == quote) {
                            value.append(quote);
                            index++;
                        } else {
                            closed = true;
                            break;
                        }
                    } else if (next == '\\' && quote != '`' && index < sql.length()) {
                        char escaped = sql.charAt(index++);
                        if (escaped == '\n') line++;
                        value.append(switch (escaped) {
                            case 'n' -> '\n';
                            case 'r' -> '\r';
                            case 't' -> '\t';
                            case '0' -> '\0';
                            default -> escaped;
                        });
                    } else value.append(next);
                }
                if (!closed) return syntaxError(startLine, "Nie zamknięto tekstu lub nazwy w SQL.", "Dodaj zamykający znak " + quote + ".");
                tokens.add(new Token(quote == '`' ? value.toString().toLowerCase(Locale.ROOT)
                        : "string:" + value, startLine));
                continue;
            }
            if (character == ';' && parentheses.isEmpty()) {
                addStatement(statements, tokens);
                tokens = new ArrayList<>();
                index++;
                continue;
            }
            if (character == '(') parentheses.add(line);
            if (character == ')') {
                if (parentheses.isEmpty()) return syntaxError(line, "Nadmiarowy nawias zamykający w SQL.", "Sprawdź pary nawiasów w tej instrukcji.");
                parentheses.remove(parentheses.size() - 1);
            }
            if (Character.isLetterOrDigit(character) || character == '_' || character == '$') {
                int start = index++;
                while (index < sql.length() && (Character.isLetterOrDigit(sql.charAt(index))
                        || sql.charAt(index) == '_' || sql.charAt(index) == '$')) index++;
                String word = sql.substring(start, index).toLowerCase(Locale.ROOT);
                tokens.add(new Token(word, line));
            } else {
                tokens.add(new Token(String.valueOf(character), line));
                index++;
            }
        }
        if (!parentheses.isEmpty()) return syntaxError(parentheses.get(0), "Nie zamknięto nawiasu w SQL.", "Dodaj brakujący nawias zamykający.");
        addStatement(statements, tokens);
        return new ParsedSql(statements, List.of());
    }

    private static void addStatement(List<Statement> statements, List<Token> tokens) {
        if (tokens.isEmpty()) return;
        List<Token> normalized = new ArrayList<>(tokens);
        if (normalized.size() > 5 && normalized.get(0).value().equals("create")
                && Set.of("database", "table").contains(normalized.get(1).value())
                && normalized.subList(2, 5).stream().map(Token::value).toList()
                        .equals(List.of("if", "not", "exists"))) {
            normalized.subList(2, 5).clear();
        }
        statements.add(new Statement(normalized));
    }

    private static ParsedSql syntaxError(int line, String message, String suggestion) {
        return new ParsedSql(List.of(), List.of(new TaskDiagnosticDto("SQL_SYNTAX_ERROR", line, message, suggestion)));
    }

    private record Token(String value, int line) {}
    private record ParsedSql(List<Statement> statements, List<TaskDiagnosticDto> diagnostics) {}
    private record Statement(List<Token> tokens) {
        List<String> values() { return tokens.stream().map(Token::value).toList(); }
        int line() { return tokens.get(0).line(); }
        boolean isInsert() {
            return tokens.size() >= 3 && tokens.get(0).value().equals("insert") && tokens.get(1).value().equals("into");
        }
        String key() {
            List<String> values = values();
            if (values.size() >= 3 && values.get(0).equals("create")) return String.join(" ", values.subList(0, 3));
            if (isInsert()) return "insert into " + values.get(2);
            if (values.size() >= 2 && values.get(0).equals("use")) return "use " + values.get(1);
            return values.get(0);
        }
        String label() {
            String key = key();
            if (key.startsWith("create database ")) return "utworzenie bazy „" + tokens.get(2).value() + "”";
            if (key.startsWith("create table ")) return "utworzenie tabeli „" + tokens.get(2).value() + "”";
            if (key.startsWith("use ")) return "wybranie bazy „" + tokens.get(1).value() + "”";
            if (isInsert()) return "dodanie rekordu do tabeli „" + tokens.get(2).value() + "”";
            return "polecenie " + tokens.get(0).value().toUpperCase(Locale.ROOT);
        }
    }
}

package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.TaskDiagnosticDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

@Service
public class CodeExecutionService {

    private static final int MAX_SOURCE_LENGTH = 50_000;
    private static final int MAX_OUTPUT_BYTES = 65_536;
    private static final int MAX_TESTS = 8;
    private static final Duration CONTAINER_TIMEOUT = Duration.ofSeconds(7);

    private final boolean enabled;
    private final String dockerBinary;
    private final String javaImage;

    public CodeExecutionService(
            @Value("${code.runner.enabled:true}") boolean enabled,
            @Value("${code.runner.docker-binary:docker}") String dockerBinary,
            @Value("${code.runner.java-image:eclipse-temurin:21-jdk-alpine}") String javaImage
    ) {
        this.enabled = enabled;
        this.dockerBinary = dockerBinary;
        this.javaImage = javaImage;
    }

    public List<TaskDiagnosticDto> evaluateJava(
            String source,
            String hiddenTests
    ) {
        if (!enabled) return List.of(unavailableDiagnostic());
        if (source == null || source.isBlank()) {
            return List.of(new TaskDiagnosticDto(
                    "EMPTY_ANSWER",
                    null,
                    "Kod jest pusty.",
                    "Uzupełnij program i uruchom testy ponownie."
            ));
        }
        if (source.length() > MAX_SOURCE_LENGTH) {
            return List.of(new TaskDiagnosticDto(
                    "SOURCE_TOO_LARGE",
                    null,
                    "Kod przekracza bezpieczny limit 50 000 znaków.",
                    "Usuń niepotrzebne fragmenty i pozostaw rozwiązanie zadania."
            ));
        }
        if (!source.matches("(?s).*\\bclass\\s+Main\\b.*")) {
            return List.of(new TaskDiagnosticDto(
                    "MAIN_CLASS_REQUIRED",
                    null,
                    "Program powinien zawierać klasę Main.",
                    "Nazwij główną klasę Main i pozostaw w niej metodę main."
            ));
        }

        List<HiddenTest> tests = parseTests(hiddenTests);
        if (tests.isEmpty()) return List.of(unavailableDiagnostic());

        List<TaskDiagnosticDto> diagnostics = new ArrayList<>();
        for (int index = 0; index < tests.size(); index++) {
            RunResult result = runJava(source, tests.get(index).input());
            if (result.status() != RunStatus.SUCCESS) {
                diagnostics.add(runtimeDiagnostic(result));
                break;
            }
            if (!normalizeOutput(result.output()).equals(
                    normalizeOutput(tests.get(index).expectedOutput())
            )) {
                diagnostics.add(new TaskDiagnosticDto(
                        "HIDDEN_TEST_FAILED",
                        null,
                        "Ukryty test " + (index + 1) + " nie przeszedł.",
                        "Sprawdź przypadki brzegowe oraz format wyświetlanego wyniku. Testy nie ujawniają danych wejściowych ani oczekiwanego wyniku."
                ));
                if (diagnostics.size() >= 3) break;
            }
        }
        return diagnostics;
    }

    List<HiddenTest> parseTests(String specification) {
        if (specification == null) return List.of();
        return specification.lines()
                .map(String::trim)
                .filter(line -> !line.isBlank() && !line.startsWith("#"))
                .limit(MAX_TESTS)
                .map(line -> {
                    int separator = line.indexOf("=>");
                    String input = separator < 0 ? "" : line.substring(0, separator).trim();
                    String output = separator < 0 ? line : line.substring(separator + 2).trim();
                    if ("<brak>".equalsIgnoreCase(input)) input = "";
                    return new HiddenTest(unescape(input), unescape(output));
                })
                .filter(test -> !test.expectedOutput().isBlank())
                .toList();
    }

    private RunResult runJava(String source, String input) {
        String encodedSource = Base64.getEncoder().encodeToString(
                source.getBytes(StandardCharsets.UTF_8)
        );
        String command = "printf '%s' '" + encodedSource
                + "' | base64 -d > /tmp/Main.java"
                + " && javac -encoding UTF-8 /tmp/Main.java || exit 42;"
                + " timeout 3 java -cp /tmp Main";
        Process process = null;
        ExecutorService reader = Executors.newSingleThreadExecutor();

        try {
            process = new ProcessBuilder(
                    dockerBinary,
                    "run", "--rm", "-i",
                    "--network", "none",
                    "--memory", "128m",
                    "--cpus", "0.50",
                    "--pids-limit", "64",
                    "--ulimit", "nofile=64:64",
                    "--cap-drop", "ALL",
                    "--user", "65534:65534",
                    "--read-only",
                    "--tmpfs", "/tmp:rw,nosuid,nodev,noexec,size=32m,mode=1777",
                    "--security-opt", "no-new-privileges",
                    javaImage,
                    "sh", "-lc", command
            ).redirectErrorStream(true).start();

            Process runningProcess = process;
            Future<byte[]> outputFuture = reader.submit(() ->
                    runningProcess.getInputStream().readNBytes(MAX_OUTPUT_BYTES + 1)
            );
            process.getOutputStream().write(input.getBytes(StandardCharsets.UTF_8));
            process.getOutputStream().close();

            if (!process.waitFor(CONTAINER_TIMEOUT.toMillis(), TimeUnit.MILLISECONDS)) {
                process.destroyForcibly();
                return new RunResult(RunStatus.TIMEOUT, "");
            }

            byte[] bytes = outputFuture.get(1, TimeUnit.SECONDS);
            if (bytes.length > MAX_OUTPUT_BYTES) {
                return new RunResult(RunStatus.OUTPUT_LIMIT, "");
            }
            String output = new String(bytes, StandardCharsets.UTF_8);
            return switch (process.exitValue()) {
                case 0 -> new RunResult(RunStatus.SUCCESS, output);
                case 42 -> new RunResult(RunStatus.COMPILATION_ERROR, output);
                case 124, 137 -> new RunResult(RunStatus.TIMEOUT, output);
                default -> new RunResult(RunStatus.RUNTIME_ERROR, output);
            };
        } catch (IOException exception) {
            return new RunResult(RunStatus.UNAVAILABLE, "");
        } catch (Exception exception) {
            if (process != null) process.destroyForcibly();
            return new RunResult(RunStatus.RUNTIME_ERROR, "");
        } finally {
            reader.shutdownNow();
        }
    }

    private TaskDiagnosticDto runtimeDiagnostic(RunResult result) {
        return switch (result.status()) {
            case COMPILATION_ERROR -> new TaskDiagnosticDto(
                    "COMPILATION_ERROR", null,
                    "Kod nie został skompilowany.",
                    summarizeCompilerOutput(result.output())
            );
            case TIMEOUT -> new TaskDiagnosticDto(
                    "EXECUTION_TIMEOUT", null,
                    "Program przekroczył limit 3 sekund.",
                    "Sprawdź, czy pętla ma warunek zakończenia i czy program nie czeka na dodatkowe dane."
            );
            case OUTPUT_LIMIT -> new TaskDiagnosticDto(
                    "OUTPUT_LIMIT", null,
                    "Program wygenerował zbyt dużo tekstu.",
                    "Ogranicz liczbę wyświetlanych wierszy i sprawdź warunek pętli."
            );
            case UNAVAILABLE -> unavailableDiagnostic();
            default -> new TaskDiagnosticDto(
                    "RUNTIME_ERROR", null,
                    "Program zakończył się błędem podczas działania.",
                    "Sprawdź wyjątki, indeksy tablic oraz dane wejściowe."
            );
        };
    }

    private TaskDiagnosticDto unavailableDiagnostic() {
        return new TaskDiagnosticDto(
                "RUNNER_UNAVAILABLE", null,
                "Bezpieczne środowisko uruchomieniowe jest chwilowo niedostępne.",
                "Spróbuj ponownie za chwilę. Administrator powinien sprawdzić usługę Docker runner."
        );
    }

    private String summarizeCompilerOutput(String output) {
        String normalized = output == null ? "" : output.replace("/tmp/Main.java", "Main.java").trim();
        if (normalized.isBlank()) return "Sprawdź składnię programu i nazwy użytych symboli.";
        return normalized.length() > 900 ? normalized.substring(0, 900) + "…" : normalized;
    }

    private String normalizeOutput(String value) {
        return value.replace("\r\n", "\n")
                .lines()
                .map(String::stripTrailing)
                .reduce((first, second) -> first + "\n" + second)
                .orElse("")
                .trim();
    }

    private String unescape(String value) {
        return value.replace("\\n", "\n").replace("\\t", "\t");
    }

    record HiddenTest(String input, String expectedOutput) {
    }

    private record RunResult(RunStatus status, String output) {
    }

    private enum RunStatus {
        SUCCESS, COMPILATION_ERROR, RUNTIME_ERROR, TIMEOUT, OUTPUT_LIMIT, UNAVAILABLE
    }
}

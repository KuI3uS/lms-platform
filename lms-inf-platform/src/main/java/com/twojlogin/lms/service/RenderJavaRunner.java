package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.TaskDiagnosticDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.Semaphore;
import java.util.stream.Collectors;

@Component
public class RenderJavaRunner {
    private static final Logger log = LoggerFactory.getLogger(RenderJavaRunner.class);
    private final RenderSandboxClient client;
    private final CodeRunnerBudgetService budget;
    private final boolean approved;
    private final Semaphore slot = new Semaphore(1);

    public RenderJavaRunner(RenderSandboxClient client, CodeRunnerBudgetService budget,
                            @Value("${code.runner.render.approved:false}") boolean approved) {
        this.client = client;
        this.budget = budget;
        this.approved = approved;
    }

    public List<TaskDiagnosticDto> evaluateJava(String source, List<CodeExecutionService.HiddenTest> tests,
                                               String javaImage) {
        if (!approved || !client.configured()) return List.of(CodeExecutionService.unavailableDiagnostic());
        if (!slot.tryAcquire()) return List.of(new TaskDiagnosticDto("RUNNER_BUSY", null,
                "Środowisko sprawdza teraz inne zadanie.", "Poczekaj chwilę i spróbuj ponownie. Próba nie jest naliczana."));
        String sandboxId = null;
        try {
            if (!budget.reserveLaunch()) return List.of(new TaskDiagnosticDto("RUNNER_BUDGET_LIMIT", null,
                    "Osiągnięto miesięczny limit uruchomień testów.",
                    "Administrator musi sprawdzić budżet testów. Twoja odpowiedź nie została oceniona jako błędna."));
            sandboxId = client.create();
            client.waitUntilRunning(sandboxId);
            long deadline = System.nanoTime() + java.util.concurrent.TimeUnit.SECONDS.toNanos(40);
            List<TaskDiagnosticDto> diagnostics = new ArrayList<>();
            for (int index = 0; index < tests.size(); index++) {
                if (System.nanoTime() > deadline) return List.of(CodeExecutionService.unavailableDiagnostic());
                CodeExecutionService.HiddenTest test = tests.get(index);
                // A fresh, networkless, read-only inner container for EACH hidden test.
                // Expected results never leave the backend. Student code never runs here.
                CodeExecutionService.RunResult result = client.execute(sandboxId,
                        command(source, test.input(), javaImage));
                if (result.status() == CodeExecutionService.RunStatus.UNAVAILABLE) {
                    return List.of(CodeExecutionService.unavailableDiagnostic());
                }
                if (result.status() != CodeExecutionService.RunStatus.SUCCESS) {
                    return List.of(CodeExecutionService.runtimeDiagnostic(result));
                }
                if (!CodeExecutionService.normalizeOutput(result.output()).equals(
                        CodeExecutionService.normalizeOutput(test.expectedOutput()))) {
                    diagnostics.add(new TaskDiagnosticDto("HIDDEN_TEST_FAILED", null,
                            "Ukryty test " + (index + 1) + " nie przeszedł.",
                            "Sprawdź przypadki brzegowe oraz format wyświetlanego wyniku. Testy nie ujawniają danych wejściowych ani oczekiwanego wyniku."));
                    if (diagnostics.size() >= 3) break;
                }
            }
            return diagnostics;
        } catch (Exception failure) {
            if (failure instanceof InterruptedException) Thread.currentThread().interrupt();
            // No source, test inputs, provider bodies or API tokens in logs / student DTOs.
            log.warn("Render Java assessment unavailable ({})", failure.getClass().getSimpleName());
            return List.of(CodeExecutionService.unavailableDiagnostic());
        } finally {
            if (sandboxId != null) {
                try { client.terminate(sandboxId); }
                catch (Exception failure) {
                    log.warn("Could not terminate Render sandbox {}; its 60-second lifetime still applies", sandboxId);
                }
            }
            slot.release();
        }
    }

    static String command(String source, String input, String javaImage) {
        String encodedInput = Base64.getEncoder().encodeToString(input.getBytes(StandardCharsets.UTF_8));
        String docker = CodeExecutionService.dockerArguments(source, javaImage).stream()
                .map(RenderJavaRunner::quote).collect(Collectors.joining(" "));
        return "printf '%s' '" + encodedInput + "' | base64 -d | timeout -s KILL 12 docker " + docker;
    }

    private static String quote(String argument) { return "'" + argument.replace("'", "'\"'\"'") + "'"; }
}

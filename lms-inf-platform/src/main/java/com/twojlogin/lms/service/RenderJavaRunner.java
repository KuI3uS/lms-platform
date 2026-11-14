package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.TaskDiagnosticDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Semaphore;

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

    public List<TaskDiagnosticDto> evaluateJava(String source, List<CodeExecutionService.HiddenTest> tests) {
        if (!approved || !client.configured()) return List.of(CodeExecutionService.unavailableDiagnostic());
        if (!slot.tryAcquire()) return List.of(new TaskDiagnosticDto("RUNNER_BUSY", null,
                "Środowisko sprawdza teraz inne zadanie.", "Poczekaj chwilę i spróbuj ponownie. Próba nie jest naliczana."));
        try {
            List<TaskDiagnosticDto> diagnostics = new ArrayList<>();
            for (int index = 0; index < tests.size(); index++) {
                if (!budget.reserveLaunch()) return List.of(new TaskDiagnosticDto("RUNNER_BUDGET_LIMIT", null,
                        "Osiągnięto miesięczny limit uruchomień testów.",
                        "Administrator musi sprawdzić budżet testów. Twoja odpowiedź nie została oceniona jako błędna."));
                CodeExecutionService.HiddenTest test = tests.get(index);
                // Render's Firecracker VM is the security boundary. A fresh VM for
                // EVERY test prevents a student's filesystem/process state carrying
                // over to another input or student. Never execute this command locally.
                CodeExecutionService.RunResult result = executeIsolated(source, test.input());
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
            slot.release();
        }
    }

    private CodeExecutionService.RunResult executeIsolated(String source, String input) throws Exception {
        String sandboxId = null;
        try {
            sandboxId = client.create();
            client.waitUntilRunning(sandboxId);
            return client.execute(sandboxId, command(source, input));
        } finally {
            if (sandboxId != null) {
                try { client.terminate(sandboxId); }
                catch (Exception failure) {
                    log.warn("Could not terminate Render sandbox {}; its 60-second lifetime still applies", sandboxId);
                }
            }
        }
    }

    static String command(String source, String input) {
        return JavaRunnerCommand.build(source, input);
    }
}

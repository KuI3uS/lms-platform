package com.twojlogin.lms.service;

import org.junit.jupiter.api.Test;
import java.io.IOException;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RenderJavaRunnerTest {
    private final RenderSandboxClient client = mock(RenderSandboxClient.class);
    private final CodeRunnerBudgetService budget = mock(CodeRunnerBudgetService.class);
    private final List<CodeExecutionService.HiddenTest> tests = List.of(
            new CodeExecutionService.HiddenTest("", "EDUHUB API"));
    private final String source = "class Main { public static void main(String[] args) {} }";

    @Test
    void disabledPaidIntegrationNeverContactsProviderOrReservesBudget() {
        assertEquals("RUNNER_UNAVAILABLE", new RenderJavaRunner(client, budget, false)
                .evaluateJava(source, tests, "jdk").get(0).type());
        verifyNoInteractions(client, budget);
    }

    @Test
    void exhaustedQuotaNeverCreatesBillableSandbox() throws Exception {
        when(client.configured()).thenReturn(true);
        assertEquals("RUNNER_BUDGET_LIMIT", new RenderJavaRunner(client, budget, true)
                .evaluateJava(source, tests, "jdk").get(0).type());
        verify(budget).reserveLaunch();
        verify(client, never()).create();
    }

    @Test
    void successfulCheckUsesOneReservationAndAlwaysTerminates() throws Exception {
        ready();
        when(client.execute(eq("sbx-test"), anyString())).thenReturn(
                new CodeExecutionService.RunResult(CodeExecutionService.RunStatus.SUCCESS, "EDUHUB API\n"));
        assertTrue(new RenderJavaRunner(client, budget, true).evaluateJava(source, tests, "jdk").isEmpty());
        verify(budget).reserveLaunch();
        verify(client).terminate("sbx-test");
    }

    @Test
    void failedStartupTerminatesSandboxAndDoesNotRefundReservation() throws Exception {
        ready();
        doThrow(new IOException("no credentials in student output")).when(client).waitUntilRunning("sbx-test");
        var result = new RenderJavaRunner(client, budget, true).evaluateJava(source, tests, "jdk");
        assertEquals("RUNNER_UNAVAILABLE", result.get(0).type());
        assertFalse(result.toString().contains("credentials"));
        verify(client).terminate("sbx-test");
        verify(budget).reserveLaunch();
    }

    @Test
    void actualCompilationFailureIsNotReclassifiedAsOutage() throws Exception {
        ready();
        when(client.execute(eq("sbx-test"), anyString())).thenReturn(
                new CodeExecutionService.RunResult(CodeExecutionService.RunStatus.COMPILATION_ERROR,
                        "/tmp/Main.java:7: error: getApplicationName() has private access"));
        var diagnostics = new RenderJavaRunner(client, budget, true).evaluateJava(source, tests, "jdk");
        assertEquals("COMPILATION_ERROR", diagnostics.get(0).type());
        assertTrue(diagnostics.get(0).suggestion().contains("private access"));
        verify(client).terminate("sbx-test");
    }

    @Test
    void shellCommandEncodesSourceAndStdinAndRetainsContainerIsolation() {
        String command = RenderJavaRunner.command("'; touch /tmp/exploit; #", "'$(dangerous)", "jdk");
        assertFalse(command.contains("touch /tmp/exploit"));
        assertFalse(command.contains("$(dangerous)"));
        for (String flag : List.of("--network", "none", "--read-only", "--pull=never", "--cap-drop", "--pids-limit")) {
            assertTrue(command.contains("'" + flag + "'"));
        }
        assertTrue(command.contains("timeout -s KILL 12"));
    }

    private void ready() throws Exception {
        when(client.configured()).thenReturn(true);
        when(budget.reserveLaunch()).thenReturn(true);
        when(client.create()).thenReturn("sbx-test");
    }
}

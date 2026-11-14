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
                .evaluateJava(source, tests).get(0).type());
        verifyNoInteractions(client, budget);
    }

    @Test
    void exhaustedQuotaNeverCreatesBillableSandbox() throws Exception {
        when(client.configured()).thenReturn(true);
        assertEquals("RUNNER_BUDGET_LIMIT", new RenderJavaRunner(client, budget, true)
                .evaluateJava(source, tests).get(0).type());
        verify(budget).reserveLaunch();
        verify(client, never()).create();
    }

    @Test
    void successfulCheckUsesOneReservationAndAlwaysTerminates() throws Exception {
        ready();
        when(client.execute(eq("sbx-test"), anyString())).thenReturn(
                new CodeExecutionService.RunResult(CodeExecutionService.RunStatus.SUCCESS, "EDUHUB API\n"));
        assertTrue(new RenderJavaRunner(client, budget, true).evaluateJava(source, tests).isEmpty());
        verify(budget).reserveLaunch();
        verify(client).terminate("sbx-test");
    }

    @Test
    void failedStartupTerminatesSandboxAndDoesNotRefundReservation() throws Exception {
        ready();
        doThrow(new IOException("no credentials in student output")).when(client).waitUntilRunning("sbx-test");
        var result = new RenderJavaRunner(client, budget, true).evaluateJava(source, tests);
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
        var diagnostics = new RenderJavaRunner(client, budget, true).evaluateJava(source, tests);
        assertEquals("COMPILATION_ERROR", diagnostics.get(0).type());
        assertTrue(diagnostics.get(0).suggestion().contains("private access"));
        verify(client).terminate("sbx-test");
    }

    @Test
    void everyHiddenInputUsesANewVmAndConsumesItsOwnReservation() throws Exception {
        ready();
        when(client.create()).thenReturn("sbx-first", "sbx-second");
        when(client.execute(anyString(), anyString())).thenReturn(
                new CodeExecutionService.RunResult(CodeExecutionService.RunStatus.SUCCESS, "ok"));
        var inputs = List.of(new CodeExecutionService.HiddenTest("first", "ok"),
                new CodeExecutionService.HiddenTest("second", "ok"));
        assertTrue(new RenderJavaRunner(client, budget, true).evaluateJava(source, inputs).isEmpty());
        verify(budget, times(2)).reserveLaunch();
        var order = inOrder(client);
        order.verify(client).configured();
        for (String id : List.of("sbx-first", "sbx-second")) {
            order.verify(client).create();
            order.verify(client).waitUntilRunning(id);
            order.verify(client).execute(eq(id), anyString());
            order.verify(client).terminate(id);
        }
    }

    @Test
    void partialQuotaExhaustionDoesNotEvaluateIncompleteChecksAsWrong() throws Exception {
        ready();
        when(budget.reserveLaunch()).thenReturn(true, false);
        when(client.execute(anyString(), anyString())).thenReturn(
                new CodeExecutionService.RunResult(CodeExecutionService.RunStatus.SUCCESS, "wrong"));
        var inputs = List.of(new CodeExecutionService.HiddenTest("first", "ok"),
                new CodeExecutionService.HiddenTest("second", "ok"));
        var result = new RenderJavaRunner(client, budget, true).evaluateJava(source, inputs);
        assertEquals(1, result.size());
        assertEquals("RUNNER_BUDGET_LIMIT", result.get(0).type());
        verify(client).create();
        verify(client).terminate("sbx-test");
    }

    @Test
    void shellCommandEncodesSourceAndStdinAndBoundsNativeJavaInsideRemoteVm() {
        String command = RenderJavaRunner.command("'; touch /tmp/exploit; #", "'$(dangerous)");
        assertFalse(command.contains("touch /tmp/exploit"));
        assertFalse(command.contains("$(dangerous)"));
        for (String forbidden : List.of("docker", "mount ", "curl ", "API_KEY")) {
            assertFalse(command.contains(forbidden));
        }
        assertTrue(command.contains("timeout -s KILL 8 /opt/java/openjdk/bin/java -Xmx192m"));
        assertTrue(command.contains("com.twojlogin.lms.runner.JavaSubmissionCompiler"));
        assertTrue(command.contains("/tmp/eduhub-java/bootstrap/com/twojlogin/lms/runner/JavaSubmissionCompiler.class"));
        assertTrue(command.contains("timeout -s KILL 3 /opt/java/openjdk/bin/java -Xmx64m"));
        assertTrue(command.contains("if [ \"$run_status\" -ne 0 ]; then exit 1; fi"));
        assertTrue(command.contains("printf '%s'"));
    }

    private void ready() throws Exception {
        when(client.configured()).thenReturn(true);
        when(budget.reserveLaunch()).thenReturn(true);
        when(client.create()).thenReturn("sbx-test");
    }
}

package com.twojlogin.lms.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CodeExecutionServiceTest {

    private final CodeExecutionService service = new CodeExecutionService(
            false,
            "docker",
            "test-image", "docker", null
    );

    @Test
    void parsesHiddenInputsWithoutExposingThemToTheStudentDto() {
        List<CodeExecutionService.HiddenTest> tests = service.parseTests("""
                # kwadrat liczby
                5 => 25
                -2 => 4
                <brak> => Hello\\nWorld
                """);

        assertEquals(3, tests.size());
        assertEquals("5", tests.get(0).input());
        assertEquals("25", tests.get(0).expectedOutput());
        assertEquals("", tests.get(2).input());
        assertEquals("Hello\nWorld", tests.get(2).expectedOutput());
    }

    @Test
    void localContainerUsesTheSameMultiFileBootstrapAndRetainsIsolation() {
        var arguments = CodeExecutionService.dockerArguments("public class Main {}", "pinned-jdk");
        for (String flag : List.of("--read-only", "--pull=never", "--cap-drop", "--pids-limit", "--user")) {
            assertTrue(arguments.contains(flag));
        }
        assertEquals("none", arguments.get(arguments.indexOf("--network") + 1));
        assertEquals("384m", arguments.get(arguments.indexOf("--memory") + 1));
        String command = arguments.get(arguments.size() - 1);
        assertTrue(command.contains("com.twojlogin.lms.runner.JavaSubmissionCompiler"));
        assertTrue(command.contains("cat > /tmp/eduhub-java/input.txt"));
    }

    @Test
    void diagnosticsUseTheRealSourceFilenameWithoutLeakingRunnerPaths() {
        var diagnostic = CodeExecutionService.runtimeDiagnostic(new CodeExecutionService.RunResult(
                CodeExecutionService.RunStatus.COMPILATION_ERROR,
                "/tmp/eduhub-java/sources/DeploymentPolicy.java:8: error: missing return statement"));
        assertEquals("COMPILATION_ERROR", diagnostic.type());
        assertTrue(diagnostic.suggestion().startsWith("DeploymentPolicy.java:8:"));
        assertFalse(diagnostic.suggestion().contains("/tmp/"));
    }
}

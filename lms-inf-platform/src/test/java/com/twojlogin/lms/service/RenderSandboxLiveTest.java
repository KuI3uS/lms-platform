package com.twojlogin.lms.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import static org.junit.jupiter.api.Assertions.*;

/** Explicit opt-in only: creates short-lived, billable VMs in the configured group.
 * Never runs during ordinary tests and never uploads expected outputs or account keys.
 */
@EnabledIfEnvironmentVariable(named = "EDUHUB_RUN_RENDER_SMOKE_TEST", matches = "true")
class RenderSandboxLiveTest {
    private final RenderSandboxClient client = new RenderSandboxClient(
            System.getenv().getOrDefault("RENDER_API_KEY", ""),
            System.getenv().getOrDefault("RENDER_WORKSPACE_ID", ""),
            System.getenv().getOrDefault("EDUHUB_RENDER_GROUP_ID", ""),
            System.getenv().getOrDefault("EDUHUB_RENDER_IMAGE_ID", ""));

    @Test
    void deploymentPolicyWithTwoPublicClassesPasses() throws Exception {
        var result = run(deploymentPolicySource(), "");
        assertEquals(CodeExecutionService.RunStatus.SUCCESS, result.status());
        assertEquals("FAILURES ACCEPTED:\ntrue\nSUCCESS RATE ACCEPTED:\ntrue\nDEPLOYMENT ALLOWED:\ntrue",
                result.output().strip());
    }

    @Test
    void deploymentPolicyPrivateApiStillFailsCompilation() throws Exception {
        var result = run(deploymentPolicySource().replace("public static boolean isDeploymentAllowed(",
                "private static boolean isDeploymentAllowed("), "");
        assertEquals(CodeExecutionService.RunStatus.COMPILATION_ERROR, result.status());
        assertTrue(result.output().contains("private access"));
    }

    @Test
    void originalPrivateMethodProducesCompilationError() throws Exception {
        var result = run("""
                class ApplicationInfo {
                    private static String getApplicationName() { return "EDUHUB API"; }
                }
                public class Main {
                    public static void main(String[] args) {
                        System.out.println(ApplicationInfo.getApplicationName());
                    }
                }
                """, "");
        assertEquals(CodeExecutionService.RunStatus.COMPILATION_ERROR, result.status());
        assertTrue(result.output().contains("private access"));
    }

    @Test
    void publicMethodFixPasses() throws Exception {
        var result = run("""
                class ApplicationInfo {
                    public static String getApplicationName() { return "EDUHUB API"; }
                }
                public class Main {
                    public static void main(String[] args) {
                        System.out.println(ApplicationInfo.getApplicationName());
                    }
                }
                """, "");
        assertEquals(CodeExecutionService.RunStatus.SUCCESS, result.status());
        assertEquals("EDUHUB API", result.output().strip());
    }

    @Test
    void standardInputIsAvailableWithoutShellInterpolation() throws Exception {
        var result = run("""
                public class Main {
                    public static void main(String[] args) throws Exception {
                        System.out.print(new java.io.BufferedReader(
                            new java.io.InputStreamReader(System.in)).readLine());
                    }
                }
                """, "'$(not-a-command) EDUHUB\n");
        assertEquals(CodeExecutionService.RunStatus.SUCCESS, result.status());
        assertEquals("'$(not-a-command) EDUHUB", result.output());
    }

    @Test
    void infiniteLoopIsTerminated() throws Exception {
        var result = run("public class Main { public static void main(String[] args) { while (true) {} } }", "");
        assertEquals(CodeExecutionService.RunStatus.TIMEOUT, result.status());
    }

    @Test
    void outputFloodIsBounded() throws Exception {
        var result = run("public class Main { public static void main(String[] args) { System.out.print(\"x\".repeat(100_000)); } }", "");
        assertEquals(CodeExecutionService.RunStatus.OUTPUT_LIMIT, result.status());
    }

    @Test
    void outboundNetworkIsBlocked() throws Exception {
        var result = run("""
                public class Main {
                    public static void main(String[] args) throws Exception {
                        try (var socket = new java.net.Socket()) {
                            socket.connect(new java.net.InetSocketAddress("1.1.1.1", 443), 800);
                            System.out.print("UNEXPECTED_NETWORK_ACCESS");
                        } catch (java.io.IOException blocked) {
                            System.out.print("BLOCKED");
                        }
                    }
                }
                """, "");
        assertEquals(CodeExecutionService.RunStatus.SUCCESS, result.status());
        assertEquals("BLOCKED", result.output());
    }

    @Test
    void filesNeverSurviveBetweenHiddenInputs() throws Exception {
        String source = """
                public class Main {
                    public static void main(String[] args) throws Exception {
                        var file = new java.io.File("/tmp/previous-test-marker");
                        System.out.print(file.exists() ? "DIRTY" : "CLEAN");
                        file.createNewFile();
                    }
                }
                """;
        for (int test = 0; test < 2; test++) {
            var result = run(source, "");
            assertEquals(CodeExecutionService.RunStatus.SUCCESS, result.status());
            assertEquals("CLEAN", result.output());
        }
    }

    private CodeExecutionService.RunResult run(String source, String input) throws Exception {
        assertTrue(client.configured(), "Explicit cloud smoke-test configuration is required");
        String id = client.create();
        try {
            client.waitUntilRunning(id);
            return client.execute(id, RenderJavaRunner.command(source, input));
        } finally {
            client.terminate(id);
        }
    }

    private String deploymentPolicySource() throws Exception {
        try (var resource = getClass().getResourceAsStream("/java/lesson-1092.txt")) {
            assertNotNull(resource);
            return new String(resource.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
        }
    }
}

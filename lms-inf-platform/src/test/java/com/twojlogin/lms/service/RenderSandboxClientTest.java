package com.twojlogin.lms.service;

import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class RenderSandboxClientTest {
    @Test
    void cloudContractPinsCostSafetyNetworkAndTokenBoundaries() throws Exception {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        String base = "http://127.0.0.1:" + server.getAddress().getPort();
        List<String> calls = new ArrayList<>();
        server.createContext("/", exchange -> {
            String path = exchange.getRequestURI().getPath();
            calls.add(path);
            String auth = exchange.getRequestHeaders().getFirst("Authorization");
            String request = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
            String response;
            if (path.equals("/v1/sandboxes")) {
                assertEquals("Bearer account-secret", auth);
                var json = JsonMapper.builder().build().readTree(request);
                assertEquals("1c-2g", json.path("plan").asText());
                assertEquals(60, json.path("timeoutSeconds").asInt());
                assertEquals(0, json.path("idleTimeoutSeconds").asInt());
                assertEquals("deny-all", json.path("networkPolicy").path("type").asText());
                assertEquals("snp-clean", json.path("snapshotId").asText());
                assertFalse(json.has("env"));
                response = "{\"id\":\"sbx-test\",\"status\":\"creating\"}";
            } else if (path.endsWith("/token")) {
                assertEquals("Bearer account-secret", auth);
                response = "{\"token\":\"execution-only\",\"method\":\"POST\",\"uri\":\"" + base + "/runs/stream\"}";
            } else if (path.equals("/runs/stream")) {
                assertEquals("Bearer execution-only", auth);
                response = "event: output\ndata: {\"stream\":\"stdout\",\"data\":\"EDUHUB API\\n\"}\n\n"
                        + "event: exit\ndata: {\"exit_code\":0}\n\n";
            } else if (path.endsWith("/terminate")) {
                assertEquals("Bearer account-secret", auth);
                response = "";
            } else {
                response = "{\"id\":\"sbx-test\",\"status\":\"running\"}";
            }
            byte[] body = response.getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(200, body.length == 0 ? -1 : body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.start();
        try {
            var client = new RenderSandboxClient("account-secret", "tea-test", "sbg-test", "snp-clean",
                    URI.create(base + "/v1"), HttpClient.newHttpClient());
            assertTrue(client.configured());
            String id = client.create();
            client.waitUntilRunning(id);
            var result = client.execute(id, "safe test command");
            assertEquals(CodeExecutionService.RunStatus.SUCCESS, result.status());
            assertEquals("EDUHUB API\n", result.output());
            client.terminate(id);
            assertEquals(5, calls.size());
        } finally { server.stop(0); }
    }

    @Test
    void incompleteAndErrorStreamsAreInfrastructureFailuresNotStudentErrors() {
        assertThrows(IOException.class, () -> RenderSandboxClient.parseEvents("event: output\ndata: {\"data\":\"partial\"}\n\n"));
        assertThrows(IOException.class, () -> RenderSandboxClient.parseEvents("event: error\ndata: {\"status\":503,\"message\":\"secret\"}\n\n"));
        assertThrows(IOException.class, () -> RenderSandboxClient.parseEvents("event: exit\ndata: {}\n\n"));
    }

    @Test
    void largeOutputIsBoundedAndCompilerExitCodesArePreserved() throws Exception {
        String data = JsonMapper.builder().build().writeValueAsString(java.util.Map.of("data", "x".repeat(65_537)));
        assertEquals(CodeExecutionService.RunStatus.OUTPUT_LIMIT,
                RenderSandboxClient.parseEvents("event: output\ndata: " + data + "\n\n").status());
        assertEquals(CodeExecutionService.RunStatus.COMPILATION_ERROR,
                RenderSandboxClient.parseEvents("event: exit\ndata: {\"exit_code\":42}\n\n").status());
        assertEquals(CodeExecutionService.RunStatus.UNAVAILABLE,
                RenderSandboxClient.parseEvents("event: exit\ndata: {\"exit_code\":125}\n\n").status());
    }
}

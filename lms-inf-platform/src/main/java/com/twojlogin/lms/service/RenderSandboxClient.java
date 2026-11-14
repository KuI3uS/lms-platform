package com.twojlogin.lms.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionStage;
import java.util.concurrent.Flow;
import java.util.concurrent.TimeUnit;

/** Render's documented REST + SSE protocol, matching render-oss/sdk v1.8.0.
 * The account key ONLY goes to api.render.com; execution uses a short-lived token.
 */
@Component
public class RenderSandboxClient {
    private static final JsonMapper JSON = JsonMapper.builder().build();
    private final String apiKey;
    private final String workspaceId;
    private final String groupId;
    private final String snapshotId;
    private final HttpClient http;
    private final URI base;

    @Autowired
    public RenderSandboxClient(@Value("${code.runner.render.api-key:}") String apiKey,
                               @Value("${code.runner.render.workspace-id:}") String workspaceId,
                               @Value("${code.runner.render.group-id:}") String groupId,
                               @Value("${code.runner.render.snapshot-id:}") String snapshotId) {
        this(apiKey, workspaceId, groupId, snapshotId, URI.create("https://api.render.com/v1"),
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3))
                        .followRedirects(HttpClient.Redirect.NEVER).build());
    }

    RenderSandboxClient(String apiKey, String workspaceId, String groupId, String snapshotId,
                        URI base, HttpClient http) {
        this.apiKey = apiKey;
        this.workspaceId = workspaceId;
        this.groupId = groupId;
        this.snapshotId = snapshotId;
        this.base = base;
        this.http = http;
    }

    public boolean configured() {
        return !apiKey.isBlank() && workspaceId.matches("tea-[A-Za-z0-9]+")
                && groupId.matches("sbg-[A-Za-z0-9]+") && snapshotId.matches("snp-[A-Za-z0-9]+");
    }

    public String create() throws IOException {
        JsonNode response = api("POST", "/sandboxes", Map.of(
                "ownerId", workspaceId, "sandboxGroupId", groupId, "snapshotId", snapshotId,
                "plan", "1c-2g", "timeoutSeconds", 60, "idleTimeoutSeconds", 0,
                "networkPolicy", Map.of("type", "deny-all")
        ));
        String id = response.path("id").asText("");
        if (!id.matches("sbx-[A-Za-z0-9]+")) throw new IOException("Invalid sandbox response");
        return id;
    }

    public void waitUntilRunning(String id) throws IOException, InterruptedException {
        for (int poll = 0; poll < 12; poll++) {
            String status = api("GET", "/sandboxes/" + id + ownerQuery(), null).path("status").asText("");
            if ("running".equals(status)) return;
            if (!"creating".equals(status)) throw new IOException("Sandbox not running");
            Thread.sleep(250);
        }
        throw new IOException("Sandbox startup timeout");
    }

    public CodeExecutionService.RunResult execute(String id, String command) throws IOException {
        JsonNode connect = api("POST", "/sandboxes/" + id + "/runs/stream/token" + ownerQuery(), null);
        URI uri = URI.create(connect.path("uri").asText(""));
        if (!validExecUri(uri, id) || !"POST".equals(connect.path("method").asText(""))) {
            throw new IOException("Invalid execution endpoint");
        }
        HttpRequest request = HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(14))
                .header("Authorization", "Bearer " + connect.path("token").asText(""))
                .header("Content-Type", "application/json").header("Accept", "text/event-stream")
                .POST(HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(Map.of("command", command))))
                .build();
        try {
            return parseEvents(new String(send(request, 256 * 1024), StandardCharsets.UTF_8));
        } catch (OutputTooLargeException tooLarge) {
            return new CodeExecutionService.RunResult(CodeExecutionService.RunStatus.OUTPUT_LIMIT, "");
        }
    }

    private boolean validExecUri(URI uri, String id) {
        // The package-private loopback transport exists only for hermetic tests.
        boolean localTest = "http".equals(base.getScheme()) && "127.0.0.1".equals(base.getHost())
                && "127.0.0.1".equals(uri.getHost()) && uri.getPort() == base.getPort();
        return uri.getUserInfo() == null && uri.getFragment() == null
                && (localTest || ("https".equals(uri.getScheme()) && uri.getPort() == -1
                && (id + ".oregon.sandbox.onrender.com").equals(uri.getHost())))
                && "/runs/stream".equals(uri.getPath());
    }

    public void terminate(String id) throws IOException {
        api("POST", "/sandboxes/" + id + "/terminate" + ownerQuery(), null);
    }

    private String ownerQuery() { return "?ownerId=" + workspaceId; }

    private JsonNode api(String method, String path, Map<String, ?> body) throws IOException {
        HttpRequest request = HttpRequest.newBuilder(URI.create(base + path)).timeout(Duration.ofSeconds(5))
                .header("Authorization", "Bearer " + apiKey).header("Accept", "application/json")
                .header("Content-Type", "application/json")
                .method(method, body == null ? HttpRequest.BodyPublishers.noBody()
                        : HttpRequest.BodyPublishers.ofString(JSON.writeValueAsString(body))).build();
        byte[] bytes = send(request, 16 * 1024);
        return bytes.length == 0 ? JSON.createObjectNode() : JSON.readTree(bytes);
    }

    private byte[] send(HttpRequest request, int limit) throws IOException {
        var future = http.sendAsync(request, info -> new LimitedBody(limit));
        try {
            HttpResponse<byte[]> response = future.get(15, TimeUnit.SECONDS);
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                // Never echo provider errors: they can contain credentials or hidden inputs.
                throw new IOException("Render HTTP " + response.statusCode());
            }
            return response.body();
        } catch (Exception failure) {
            future.cancel(true);
            if (failure instanceof InterruptedException) Thread.currentThread().interrupt();
            Throwable cause = failure;
            while (cause.getCause() != null) cause = cause.getCause();
            if (cause instanceof OutputTooLargeException limitFailure) throw limitFailure;
            throw new IOException("Render request unavailable");
        }
    }

    static CodeExecutionService.RunResult parseEvents(String events) throws IOException {
        StringBuilder output = new StringBuilder();
        int outputBytes = 0;
        for (String frame : events.replace("\r\n", "\n").split("\n\n")) {
            String event = "";
            StringBuilder data = new StringBuilder();
            for (String line : frame.split("\n")) {
                if (line.startsWith("event:")) event = line.substring(6).trim();
                if (line.startsWith("data:")) data.append(line.substring(5).stripLeading()).append('\n');
            }
            if (event.isBlank()) continue; // SSE comments / keepalives
            JsonNode payload = JSON.readTree(data.toString());
            if ("output".equals(event)) {
                String chunk = payload.path("data").asText("");
                outputBytes += chunk.getBytes(StandardCharsets.UTF_8).length;
                if (outputBytes > 65_536) {
                    return new CodeExecutionService.RunResult(CodeExecutionService.RunStatus.OUTPUT_LIMIT, "");
                }
                output.append(chunk);
            } else if ("exit".equals(event) && payload.path("exit_code").isIntegralNumber()) {
                return CodeExecutionService.resultForExitCode(payload.path("exit_code").asInt(), output.toString());
            } else {
                throw new IOException("Incomplete sandbox execution");
            }
        }
        throw new IOException("Missing execution exit status");
    }

    private static final class OutputTooLargeException extends IOException { }

    /** Cancel a response before its body can exhaust the small backend's heap. */
    private static final class LimitedBody implements HttpResponse.BodySubscriber<byte[]> {
        private final int limit;
        private final ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        private final CompletableFuture<byte[]> result = new CompletableFuture<>();
        private Flow.Subscription subscription;
        LimitedBody(int limit) { this.limit = limit; }
        public CompletionStage<byte[]> getBody() { return result; }
        public void onSubscribe(Flow.Subscription subscription) {
            this.subscription = subscription;
            subscription.request(1);
        }
        public void onNext(List<ByteBuffer> buffers) {
            for (ByteBuffer buffer : buffers) {
                if (bytes.size() + buffer.remaining() > limit) {
                    subscription.cancel();
                    result.completeExceptionally(new OutputTooLargeException());
                    return;
                }
                byte[] part = new byte[buffer.remaining()];
                buffer.get(part);
                bytes.writeBytes(part);
            }
            subscription.request(1);
        }
        public void onError(Throwable failure) { result.completeExceptionally(failure); }
        public void onComplete() { result.complete(bytes.toByteArray()); }
    }
}

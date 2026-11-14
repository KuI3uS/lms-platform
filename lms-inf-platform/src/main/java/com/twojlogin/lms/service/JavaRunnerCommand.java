package com.twojlogin.lms.service;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/** Build a command for the remote VM / local isolated container, never the API host. */
final class JavaRunnerCommand {
    private JavaRunnerCommand() { }

    static String build(String source, String input) {
        String encodedSource = encode(source.getBytes(StandardCharsets.UTF_8));
        String inputCommand = input == null
                ? "cat > /tmp/eduhub-java/input.txt || exit 125"
                : "printf '%s' '" + encode(input.getBytes(StandardCharsets.UTF_8))
                    + "' | base64 -d > /tmp/eduhub-java/input.txt || exit 125";
        return """
                umask 077
                test -x /opt/java/openjdk/bin/javac && test -x /opt/java/openjdk/bin/java || exit 125
                mkdir -p /tmp/eduhub-java/submission /tmp/eduhub-java/sources /tmp/eduhub-java/classes /tmp/eduhub-java/bootstrap/com/twojlogin/lms/runner || exit 125
                printf '%%s' '%s' | base64 -d > /tmp/eduhub-java/submission/Main.java || exit 125
                printf '%%s' '%s' | base64 -d > /tmp/eduhub-java/bootstrap/com/twojlogin/lms/runner/JavaSubmissionCompiler.class || exit 125
                %s
                timeout -s KILL 8 /opt/java/openjdk/bin/java -Xmx192m -XX:ActiveProcessorCount=1 -cp /tmp/eduhub-java/bootstrap com.twojlogin.lms.runner.JavaSubmissionCompiler /tmp/eduhub-java/submission/Main.java /tmp/eduhub-java/sources /tmp/eduhub-java/classes /tmp/eduhub-java/main-class.txt
                compile_status=$?
                if [ "$compile_status" -eq 124 ] || [ "$compile_status" -eq 137 ]; then exit 43; fi
                if [ "$compile_status" -eq 125 ]; then exit 125; fi
                if [ "$compile_status" -ne 0 ]; then exit 42; fi
                entry_class=$(cat /tmp/eduhub-java/main-class.txt) || exit 125
                timeout -s KILL 3 /opt/java/openjdk/bin/java -Xmx64m -XX:MaxMetaspaceSize=64m -XX:ReservedCodeCacheSize=32m -XX:ActiveProcessorCount=1 -cp /tmp/eduhub-java/classes "$entry_class" < /tmp/eduhub-java/input.txt
                run_status=$?
                if [ "$run_status" -eq 124 ] || [ "$run_status" -eq 137 ]; then exit 124; fi
                if [ "$run_status" -ne 0 ]; then exit 1; fi
                """.formatted(encodedSource, encodedCompiler(), inputCommand);
    }

    private static String encodedCompiler() {
        // Read bytes, not a Class literal: do not load or run compiler APIs in Spring.
        try (var resource = JavaRunnerCommand.class.getResourceAsStream(
                "/com/twojlogin/lms/runner/JavaSubmissionCompiler.class")) {
            if (resource == null) throw new IllegalStateException("Runner compiler bootstrap is missing");
            return encode(resource.readAllBytes());
        } catch (IOException failure) {
            throw new IllegalStateException("Runner compiler bootstrap is unavailable", failure);
        }
    }

    private static String encode(byte[] value) { return Base64.getEncoder().encodeToString(value); }
}

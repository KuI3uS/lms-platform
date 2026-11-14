package com.twojlogin.lms.runner;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import javax.tools.Diagnostic;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaFileObject;
import javax.tools.ToolProvider;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/** Parser/compilation tests only. Never execute a submitted program on the host. */
class JavaSubmissionCompilerTest {
    @TempDir Path directory;

    @Test
    void lesson1092CompilesAsTwoPublicFilesWithoutWeakeningVisibility() throws Exception {
        String source = lesson1092();
        var files = prepare(source);
        assertEquals(Set.of("DeploymentPolicy.java", "Main.java"), names(files));
        String policy = Files.readString(directory.resolve("sources/DeploymentPolicy.java"));
        assertTrue(policy.contains("public class DeploymentPolicy"));
        assertTrue(policy.contains("private static final int MAX_FAILED_CHECKS"));
        assertTrue(policy.contains("private static final double MIN_SUCCESS_RATE"));
        assertTrue(Files.readString(directory.resolve("sources/Main.java")).contains("public class Main"));
        assertTrue(compile(files).isEmpty());
        assertEquals("Main", Files.readString(directory.resolve("entry-point.txt")));
    }

    @Test
    void realPrivateAccessErrorAndOriginalLineNumbersArePreserved() throws Exception {
        String source = lesson1092().replace("public static boolean isDeploymentAllowed(",
                "private static boolean isDeploymentAllowed(");
        var errors = compile(prepare(source));
        assertEquals(1, errors.size());
        assertTrue(errors.get(0).getMessage(Locale.ROOT).contains("private access"));
        assertTrue(errors.get(0).getSource().getName().endsWith("Main.java"));
        int callOffset = source.indexOf("System.out.println(DeploymentPolicy.isDeploymentAllowed");
        long originalLine = source.substring(0, callOffset).chars().filter(value -> value == '\n').count() + 1;
        assertEquals(originalLine, errors.get(0).getLineNumber());
    }

    @Test
    void importsPackagesNestedTypesCommentsAndTextBlocksAreNotSplitByRegex() throws Exception {
        String source = """
                package school.example;
                import java.util.List;
                // ../../outside.java and public class NotAType {}
                public class Holder {
                    public static class Nested { }
                    public static String message() { return \"\"\"
                public class AlsoNotAType { }
                } // braces inside a text block
                \"\"\"; }
                }
                public class Main {
                    public static void main(String[] args) {
                        System.out.print(List.of(new Holder.Nested()).size());
                    }
                }
                """;
        var files = prepare(source);
        assertEquals(Set.of("Holder.java", "Main.java"), names(files));
        assertTrue(compile(files).isEmpty());
        assertEquals("school.example.Main", Files.readString(directory.resolve("entry-point.txt")));
        for (Path file : files) assertEquals(directory.resolve("sources"), file.getParent());
        assertTrue(Files.readString(directory.resolve("sources/Holder.java"))
                .contains("public static class Nested"));
    }

    @Test
    void publicInterfacesEnumsAndRecordsAlsoReceiveTheirRealFilenames() throws Exception {
        var files = prepare("""
                public sealed interface Policy permits Rule { }
                public record Rule(int limit) implements Policy { }
                public enum Status { PASS, FAIL }
                public class Main { public static void main(String[] args) { System.out.print(new Rule(1)); } }
                """);
        assertEquals(Set.of("Policy.java", "Rule.java", "Status.java", "Main.java"), names(files));
        assertTrue(compile(files).isEmpty());
    }

    @Test
    void aValidSingleFileAndImplicitSealedPermitsInferenceStayUnchanged() throws Exception {
        String source = """
                sealed interface Policy { }
                final class Rule implements Policy { }
                public class Main { public static void main(String[] args) { System.out.print(new Rule()); } }
                """;
        var files = prepare(source);
        assertEquals(Set.of("Main.java"), names(files));
        assertEquals(source, Files.readString(files.get(0)));
        assertTrue(compile(files).isEmpty());
    }

    @Test
    void aSinglePublicHelperAndPackagePrivateMainKeepOneCompilationUnit() throws Exception {
        String source = "public class Helper {} class Main { public static void main(String[] args) {} }";
        var files = prepare(source);
        assertEquals(Set.of("Helper.java"), names(files));
        assertEquals(source, Files.readString(files.get(0)));
        assertTrue(compile(files).isEmpty());
    }

    @Test
    void unicodeIdentifiersAndCrLfOffsetsRemainValid() throws Exception {
        String source = "public class DaneŻółwia { public static int liczba() { return 1; } }\r\n"
                + "public class Main { public static void main(String[] args) { System.out.print(DaneŻółwia.liczba()); } }\r\n";
        var files = prepare(source);
        assertEquals(Set.of("DaneŻółwia.java", "Main.java"), names(files));
        assertTrue(compile(files).isEmpty());
    }

    @Test
    void malformedJavaIsKeptIntactForActualCompilerDiagnostics() throws Exception {
        String source = "public class Main { public static void main(String[] args) { ??? } }";
        var files = prepare(source);
        assertEquals(Set.of("Main.java"), names(files));
        assertEquals(source, Files.readString(files.get(0)));
        assertFalse(compile(files).isEmpty());
    }

    @Test
    void duplicateTopLevelTypesAreNotOverwrittenOrSilentlyAccepted() throws Exception {
        String source = "class Same {} class Same {} public class Main {}";
        var files = prepare(source);
        assertEquals(Set.of("Main.java"), names(files));
        assertEquals(source, Files.readString(files.get(0)));
        assertFalse(compile(files).isEmpty());
    }

    @Test
    void annotationProcessingIsAlwaysDisabled() {
        assertTrue(JavaSubmissionCompiler.compilerOptions(directory, directory).contains("-proc:none"));
    }

    private List<Path> prepare(String source) throws Exception {
        Path submission = directory.resolve("Main.java");
        Files.writeString(submission, source);
        return JavaSubmissionCompiler.prepareSources(submission, directory.resolve("sources"),
                directory.resolve("entry-point.txt"));
    }

    private Set<String> names(List<Path> files) {
        return files.stream().map(file -> file.getFileName().toString()).collect(Collectors.toSet());
    }

    private List<Diagnostic<? extends JavaFileObject>> compile(List<Path> files) throws Exception {
        var compiler = ToolProvider.getSystemJavaCompiler();
        var diagnostics = new DiagnosticCollector<JavaFileObject>();
        Path classes = Files.createDirectories(directory.resolve("classes"));
        try (var manager = compiler.getStandardFileManager(diagnostics, Locale.ROOT, StandardCharsets.UTF_8)) {
            compiler.getTask(null, manager, diagnostics,
                    JavaSubmissionCompiler.compilerOptions(directory.resolve("sources"), classes), null,
                    manager.getJavaFileObjectsFromPaths(files)).call();
        }
        return diagnostics.getDiagnostics().stream().filter(item -> item.getKind() == Diagnostic.Kind.ERROR).toList();
    }

    private String lesson1092() throws Exception {
        try (var resource = getClass().getResourceAsStream("/java/lesson-1092.txt")) {
            assertNotNull(resource);
            return new String(resource.readAllBytes(), StandardCharsets.UTF_8);
        }
    }
}

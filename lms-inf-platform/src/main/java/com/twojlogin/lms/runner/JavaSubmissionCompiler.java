package com.twojlogin.lms.runner;

import com.sun.source.tree.ClassTree;
import com.sun.source.tree.Tree;
import com.sun.source.util.JavacTask;
import com.sun.source.util.Trees;

import javax.lang.model.SourceVersion;
import javax.lang.model.element.Modifier;
import javax.tools.Diagnostic;
import javax.tools.DiagnosticCollector;
import javax.tools.JavaCompiler;
import javax.tools.JavaFileObject;
import javax.tools.ToolProvider;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;

/** Trusted bootstrap, executed ONLY inside the isolated runner, never by the API.
 * Uses javac's parser rather than regexes; it never executes submitted classes.
 * This class deliberately has no application dependencies or nested class files.
 */
public final class JavaSubmissionCompiler {
    private JavaSubmissionCompiler() { }

    public static void main(String[] args) {
        if (args.length != 4) System.exit(125);
        try {
            Path submission = Path.of(args[0]);
            Path sources = Path.of(args[1]);
            Path classes = Path.of(args[2]);
            Path entryPoint = Path.of(args[3]);
            Files.createDirectories(classes);
            List<Path> files = prepareSources(submission, sources, entryPoint);
            List<String> options = new ArrayList<>(compilerOptions(sources, classes));
            files.forEach(file -> options.add(file.toString()));
            int result = compiler().run(null, System.out, System.err, options.toArray(String[]::new));
            System.exit(result == 0 ? 0 : 42);
        } catch (IOException | RuntimeException infrastructureFailure) {
            System.err.println("Runner source preparation failed.");
            System.exit(125);
        }
    }

    public static List<String> compilerOptions(Path sources, Path classes) {
        return List.of("-proc:none", "-encoding", "UTF-8", "-classpath", classes.toString(),
                "-sourcepath", sources.toString(), "-d", classes.toString());
    }

    public static List<Path> prepareSources(Path submission, Path directory, Path entryPoint) throws IOException {
        String source = Files.readString(submission, StandardCharsets.UTF_8);
        Path sources = directory.toAbsolutePath().normalize();
        Files.createDirectories(sources);
        JavaCompiler compiler = compiler();
        var diagnostics = new DiagnosticCollector<JavaFileObject>();
        try (var manager = compiler.getStandardFileManager(diagnostics, Locale.ROOT, StandardCharsets.UTF_8)) {
            var task = (JavacTask) compiler.getTask(null, manager, diagnostics, List.of("-proc:none"),
                    null, manager.getJavaFileObjects(submission));
            var unit = task.parse().iterator().next();
            String packageName = unit.getPackageName() == null ? "" : unit.getPackageName().toString();
            if (!packageName.isEmpty() && !qualifiedName(packageName)) throw new IOException("Invalid package name");
            Files.writeString(entryPoint, packageName.isEmpty() ? "Main" : packageName + ".Main",
                    StandardCharsets.UTF_8);

            // Malformed Java remains untouched so javac reports the original error.
            if (diagnostics.getDiagnostics().stream().anyMatch(item -> item.getKind() == Diagnostic.Kind.ERROR)) {
                return originalSource(source, sources);
            }
            var declarations = unit.getTypeDecls().stream()
                    .filter(tree -> tree.getKind() != Tree.Kind.EMPTY_STATEMENT).toList();
            if (declarations.isEmpty()) return originalSource(source, sources);
            var positions = Trees.instance(task).getSourcePositions();
            int headerEnd = (int) positions.getStartPosition(unit, declarations.get(0));
            if (headerEnd < 0 || headerEnd > source.length()) return originalSource(source, sources);
            var names = new HashSet<String>();
            // Validate every destination before writing any student-controlled file.
            for (Tree declaration : declarations) {
                if (!(declaration instanceof ClassTree type) || !identifier(type.getSimpleName().toString())
                        || !names.add(type.getSimpleName().toString())) return originalSource(source, sources);
                long start = positions.getStartPosition(unit, declaration);
                long end = positions.getEndPosition(unit, declaration);
                if (start < headerEnd || end < start || end > source.length()) return originalSource(source, sources);
            }
            var publicTypes = declarations.stream().map(tree -> (ClassTree) tree)
                    .filter(type -> type.getModifiers().getFlags().contains(Modifier.PUBLIC)).toList();
            // Preserve already-valid compilation units, including Java's implicit
            // sealed permits inference between types declared in the SAME file.
            if (publicTypes.size() <= 1) {
                String filename = publicTypes.isEmpty() ? "Main" : publicTypes.get(0).getSimpleName().toString();
                Path file = sources.resolve(filename + ".java");
                Files.writeString(file, source, StandardCharsets.UTF_8);
                return List.of(file);
            }
            if (declarations.size() > 64) throw new IOException("Too many source files");
            List<Path> files = new ArrayList<>();
            for (Tree declaration : declarations) {
                var type = (ClassTree) declaration;
                int start = (int) positions.getStartPosition(unit, type);
                int end = (int) positions.getEndPosition(unit, type);
                Path file = sources.resolve(type.getSimpleName() + ".java").normalize();
                if (!sources.equals(file.getParent())) throw new IOException("Invalid source destination");
                // Keep the common package/import header and ORIGINAL line/column offsets.
                // Only other top-level declarations are blanked out; modifiers,
                // nested types, strings and comments inside this declaration are intact.
                String padding = source.substring(headerEnd, start).replaceAll("[^\\r\\n\\t]", " ");
                Files.writeString(file, source.substring(0, headerEnd) + padding + source.substring(start, end),
                        StandardCharsets.UTF_8);
                files.add(file);
            }
            return files;
        }
    }

    private static List<Path> originalSource(String source, Path sources) throws IOException {
        Path file = sources.resolve("Main.java");
        Files.writeString(file, source, StandardCharsets.UTF_8);
        return List.of(file);
    }

    private static boolean qualifiedName(String name) {
        for (String part : name.split("\\.", -1)) if (!identifier(part)) return false;
        return true;
    }

    private static boolean identifier(String name) {
        return SourceVersion.isIdentifier(name) && !SourceVersion.isKeyword(name);
    }

    private static JavaCompiler compiler() throws IOException {
        JavaCompiler compiler = ToolProvider.getSystemJavaCompiler();
        if (compiler == null) throw new IOException("A JDK is required by the isolated runner");
        return compiler;
    }
}

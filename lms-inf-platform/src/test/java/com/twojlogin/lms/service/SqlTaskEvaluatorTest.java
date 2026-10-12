package com.twojlogin.lms.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SqlTaskEvaluatorTest {
    private static final String EXPECTED = """
            CREATE DATABASE serwis_lab;
            USE serwis_lab;

            CREATE TABLE urzadzenia (
                id INT,
                typ VARCHAR(40),
                producent VARCHAR(40),
                status VARCHAR(20)
            );

            INSERT INTO urzadzenia (id, typ, producent, status) VALUES
            (1, 'Laptop', 'Lenovo', 'przyjety'),
            (2, 'Telefon', 'Samsung', 'diagnoza'),
            (3, 'Komputer', 'Dell', 'naprawa'),
            (4, 'Monitor', 'LG', 'zakonczony');
            """;

    @Test
    void acceptsTheServiceLabAnswerRegardlessOfSqlCaseAndLayout() {
        String answer = """
                create database serwis_lab; use serwis_lab;
                create table urzadzenia(id int, typ varchar (40), producent varchar(40), status varchar(20));
                insert into urzadzenia(id,typ,producent,status) values(1,'Laptop','Lenovo','przyjety'),(2,'Telefon','Samsung','diagnoza'),(3,'Komputer','Dell','naprawa'),(4,'Monitor','LG','zakonczony');
                """;
        assertTrue(SqlTaskEvaluator.evaluate(answer, EXPECTED).isEmpty());
        assertTrue(SqlTaskEvaluator.evaluate(EXPECTED, answer).isEmpty());
    }

    @Test
    void acceptsIdentifierQuotesCommentsAndIdempotentCreation() {
        String answer = EXPECTED.replace("CREATE DATABASE", "CREATE DATABASE IF NOT EXISTS")
                .replace("CREATE TABLE", "CREATE TABLE IF NOT EXISTS")
                .replace("serwis_lab", "`serwis_lab`")
                .replace("urzadzenia", "`urzadzenia`")
                .replace("typ VARCHAR", "typ /* wymagany typ */ VARCHAR");
        assertTrue(SqlTaskEvaluator.evaluate("-- konfiguracja\n# baza\n" + answer, EXPECTED).isEmpty());
    }

    @Test
    void acceptsSeparateInsertStatementsAndReorderedRows() {
        String answer = EXPECTED.substring(0, EXPECTED.indexOf("INSERT")) + """
                INSERT INTO urzadzenia (id, typ, producent, status) VALUES (4, 'Monitor', 'LG', 'zakonczony');
                INSERT INTO urzadzenia (id, typ, producent, status) VALUES (2, 'Telefon', 'Samsung', 'diagnoza');
                INSERT INTO urzadzenia (id, typ, producent, status) VALUES (1, 'Laptop', 'Lenovo', 'przyjety');
                INSERT INTO urzadzenia (id, typ, producent, status) VALUES (3, 'Komputer', 'Dell', 'naprawa');
                """;
        assertTrue(SqlTaskEvaluator.evaluate(answer, EXPECTED).isEmpty());
        assertTrue(SqlTaskEvaluator.evaluate(EXPECTED, answer).isEmpty());
    }

    @Test
    void permitsAnOptionalPreviewButRequiresItWhenConfigured() {
        String withPreview = EXPECTED + "SELECT * FROM urzadzenia;";
        assertTrue(SqlTaskEvaluator.evaluate(withPreview, EXPECTED).isEmpty());
        assertTrue(SqlTaskEvaluator.evaluate(withPreview, withPreview).isEmpty());
        assertEquals("MISSING_SQL_STATEMENT", SqlTaskEvaluator.evaluate(EXPECTED, withPreview).get(0).type());
        assertFalse(SqlTaskEvaluator.evaluate("SELECT * FROM urzadzenia;\n" + EXPECTED, EXPECTED).isEmpty());
        assertFalse(SqlTaskEvaluator.evaluate(EXPECTED + "SELECT * FROM inna_tabela;", EXPECTED).isEmpty());
    }

    @Test
    void ignoresOuterMarkdownCodeFencesInAnImportedReference() {
        assertTrue(SqlTaskEvaluator.evaluate(EXPECTED, "```sql\n" + EXPECTED + "```").isEmpty());
        assertTrue(SqlTaskEvaluator.evaluate(EXPECTED, "\n\n```sql\n" + EXPECTED + "```\n").isEmpty());
        assertTrue(SqlTaskEvaluator.evaluate(EXPECTED.replace("    ", "\u00a0\u00a0").replace("\n", "\r\n"), EXPECTED).isEmpty());
    }

    @Test
    void reportsTheLineOfAnIncorrectColumnType() {
        var diagnostics = SqlTaskEvaluator.evaluate(EXPECTED.replace("status VARCHAR(20)", "status VARCHAR(40)"), EXPECTED);
        assertEquals(1, diagnostics.size());
        assertEquals("INCORRECT_SQL_STATEMENT", diagnostics.get(0).type());
        assertEquals(8, diagnostics.get(0).line());
        assertTrue(diagnostics.get(0).message().contains("urzadzenia"));
    }

    @Test
    void reportsIncorrectDataWithoutIgnoringStringCaseOrWhitespace() {
        for (String value : new String[] {"lenovo", "Le novo", "Lenovo "}) {
            var diagnostics = SqlTaskEvaluator.evaluate(EXPECTED.replace("'Lenovo'", "'" + value + "'"), EXPECTED);
            assertEquals(1, diagnostics.size());
            assertEquals("INCORRECT_SQL_STATEMENT", diagnostics.get(0).type());
            assertEquals(12, diagnostics.get(0).line());
        }
    }

    @Test
    void preservesEscapedQuotesAndSqlPunctuationInsideStringValues() {
        String reference = "INSERT INTO teksty (tresc) VALUES ('It''s (a); -- # /* text */');";
        String answer = "insert into teksty(tresc) values(\"It's (a); -- # /* text */\");";
        assertTrue(SqlTaskEvaluator.evaluate(answer, reference).isEmpty());
        assertTrue(SqlTaskEvaluator.evaluate("INSERT INTO teksty (tresc) VALUES ('It\\'s (a); -- # /* text */');", reference).isEmpty());
    }

    @Test
    void rejectsMissingExtraAndDuplicateRecords() {
        String missing = EXPECTED.replace(",\n(4, 'Monitor', 'LG', 'zakonczony')", "");
        assertEquals("MISSING_SQL_STATEMENT", SqlTaskEvaluator.evaluate(missing, EXPECTED).get(0).type());
        String extra = EXPECTED.replace("(4, 'Monitor', 'LG', 'zakonczony');",
                "(4, 'Monitor', 'LG', 'zakonczony'), (5, 'Laptop', 'Lenovo', 'przyjety');");
        assertEquals("UNEXPECTED_SQL_STATEMENT", SqlTaskEvaluator.evaluate(extra, EXPECTED).get(0).type());
        assertFalse(SqlTaskEvaluator.evaluate(EXPECTED + "INSERT INTO urzadzenia (id, typ, producent, status) VALUES (1, 'Laptop', 'Lenovo', 'przyjety');", EXPECTED).isEmpty());
    }

    @Test
    void rejectsDestructiveSuffixesAndExecutableComments() {
        assertEquals("UNEXPECTED_SQL_STATEMENT", SqlTaskEvaluator.evaluate(EXPECTED + "DROP TABLE urzadzenia;", EXPECTED).get(0).type());
        assertFalse(SqlTaskEvaluator.evaluate(EXPECTED.replace("(4, 'Monitor', 'LG', 'zakonczony');", "(4, 'Monitor', 'LG', 'zakonczony') ON DUPLICATE KEY UPDATE status = 'inny';"), EXPECTED).isEmpty());
        assertEquals("SQL_SYNTAX_ERROR", SqlTaskEvaluator.evaluate(EXPECTED + "/*! DROP TABLE urzadzenia */;", EXPECTED).get(0).type());
        assertFalse(SqlTaskEvaluator.evaluate(EXPECTED + "/*M! DROP TABLE urzadzenia */;", EXPECTED).isEmpty());
    }

    @Test
    void rejectsAnIncorrectOrderAndMissingStatementSeparators() {
        assertEquals("SQL_STATEMENT_ORDER", SqlTaskEvaluator.evaluate(EXPECTED.replace("CREATE DATABASE serwis_lab;\nUSE serwis_lab;", "USE serwis_lab;\nCREATE DATABASE serwis_lab;"), EXPECTED).get(0).type());
        assertFalse(SqlTaskEvaluator.evaluate(EXPECTED.replace("CREATE DATABASE serwis_lab;", "CREATE DATABASE serwis_lab"), EXPECTED).isEmpty());
    }

    @Test
    void identifiesUnclosedQuotesParenthesesAndComments() {
        assertEquals("SQL_SYNTAX_ERROR", SqlTaskEvaluator.evaluate("CREATE TABLE urzadzenia (id INT;", EXPECTED).get(0).type());
        assertEquals("SQL_SYNTAX_ERROR", SqlTaskEvaluator.evaluate("INSERT INTO urzadzenia VALUES ('Laptop);", EXPECTED).get(0).type());
        assertEquals("SQL_SYNTAX_ERROR", SqlTaskEvaluator.evaluate("/* komentarz", EXPECTED).get(0).type());
        assertFalse(SqlTaskEvaluator.evaluate(EXPECTED.replace("(4, 'Monitor', 'LG', 'zakonczony');", "(4, 'Monitor', 'LG', 'zakonczony'),;"), EXPECTED).isEmpty());
    }

    @Test
    void distinguishesAnEmptyAnswerFromAnInvalidTeacherReference() {
        assertEquals("EMPTY_ANSWER", SqlTaskEvaluator.evaluate("-- tylko komentarz\n", EXPECTED).get(0).type());
        assertEquals("SQL_REFERENCE_ERROR", SqlTaskEvaluator.evaluate(EXPECTED, "```sql\nCREATE TABLE test (id INT;\n```").get(0).type());
    }
}

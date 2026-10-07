package com.twojlogin.lms.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CodeExecutionServiceTest {

    private final CodeExecutionService service = new CodeExecutionService(
            false,
            "docker",
            "test-image"
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
}

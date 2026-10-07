package com.twojlogin.lms.curriculum;

import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JavaJuniorCurriculumTest {

    @Test
    void containsCompleteNumberedCurriculumWithAssessments() {
        var modules = JavaJuniorCurriculum.modules();

        assertEquals(52, modules.size());
        Set<Integer> numbers = new HashSet<>();

        modules.forEach(module -> {
            numbers.add(module.number());
            assertFalse(module.focus().isBlank());
            assertTrue(module.theory().length() > 180);
            assertFalse(module.exampleCode().isBlank());
            assertFalse(module.expectedAnswer().isBlank());
            assertEquals(4, module.quizOptions().size());
            assertTrue(module.quizOptions().contains(module.quizAnswer()));
        });

        assertEquals(52, numbers.size());
        assertTrue(numbers.contains(1));
        assertTrue(numbers.contains(52));
    }
}

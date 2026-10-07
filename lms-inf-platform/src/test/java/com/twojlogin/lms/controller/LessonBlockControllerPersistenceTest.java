package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.LessonBlockDto;
import com.twojlogin.lms.dto.LessonBlockRequest;
import com.twojlogin.lms.entity.BlockType;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.repository.LessonBlockRepository;
import com.twojlogin.lms.repository.LessonRepository;
import com.twojlogin.lms.repository.TaskAttemptRepository;
import com.twojlogin.lms.service.CourseAccessService;
import com.twojlogin.lms.service.TaskEvaluationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;

@DataJpaTest
class LessonBlockControllerPersistenceTest {

    @Autowired
    private LessonBlockRepository blockRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private TaskAttemptRepository attemptRepository;

    @Test
    void createsACompleteTaskBlockWithoutEntityDeserialization() {
        Lesson lesson = createLesson();
        LessonBlockController controller = createController();
        LessonBlockRequest request = new LessonBlockRequest(
                "Wyświetl napis",
                BlockType.TASK,
                null,
                "Pierwszy program",
                "Wyświetl tekst w konsoli.",
                "public class Main {\n}",
                "System.out.println(\"Witaj świecie\");",
                "Użyj println.",
                "Sprawdź metodę main.",
                "Instrukcja wypisuje tekst.",
                "java",
                null,
                null,
                true,
                10,
                null
        );

        LessonBlockDto saved = controller.create(lesson.getId(), request);

        assertNotNull(saved.id());
        assertEquals(BlockType.TASK, saved.type());
        assertEquals(lesson.getId(), saved.lessonId());
        assertEquals(0, saved.orderIndex());
        assertEquals(10, saved.points());
    }

    @Test
    void createsLongTextBlockWithLegacyCompatibleEmptyValues() {
        Lesson lesson = createLesson();
        LessonBlockController controller = createController();
        String content = "Długi materiał lekcji. ".repeat(100);

        LessonBlockDto saved = controller.create(
                lesson.getId(),
                new LessonBlockRequest(
                        "Programowanie od absolutnych podstaw",
                        BlockType.TEXT,
                        content,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        null,
                        true,
                        5,
                        null
                )
        );

        assertNotNull(saved.id());
        assertEquals(content.trim(), saved.content());
        assertEquals("", saved.description());
        assertEquals("", saved.instruction());
        assertEquals("", saved.starterCode());
        assertEquals("", saved.expectedAnswer());
        assertEquals("", saved.mediaUrl());
    }

    @Test
    void createsEverySupportedBlockType() {
        Lesson lesson = createLesson();
        LessonBlockController controller = createController();

        for (BlockType type : BlockType.values()) {
            String requiredAnswer =
                    type == BlockType.TASK || type == BlockType.QUIZ
                            ? "poprawna odpowiedź"
                            : null;

            LessonBlockDto saved = controller.create(
                    lesson.getId(),
                    new LessonBlockRequest(
                            type == BlockType.DIVIDER ? null : "Blok " + type,
                            type,
                            "Treść",
                            null,
                            type == BlockType.TASK ? "Wykonaj zadanie" : null,
                            null,
                            requiredAnswer,
                            null,
                            null,
                            null,
                            null,
                            null,
                            null,
                            true,
                            5,
                            null
                    )
            );

            assertNotNull(saved.id());
            assertEquals(type, saved.type());
        }
    }

    private Lesson createLesson() {
        Lesson lesson = new Lesson();
        lesson.setTitle("Pierwsza lekcja");
        lesson.setOrderIndex(1);
        return lessonRepository.saveAndFlush(lesson);
    }

    private LessonBlockController createController() {
        return new LessonBlockController(
                blockRepository,
                lessonRepository,
                attemptRepository,
                mock(TaskEvaluationService.class),
                mock(CourseAccessService.class)
        );
    }
}

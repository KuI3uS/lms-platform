package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.LessonBlockDto;
import com.twojlogin.lms.dto.LessonBlockRequest;
import com.twojlogin.lms.entity.BlockType;
import com.twojlogin.lms.entity.Course;
import com.twojlogin.lms.entity.CourseModule;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.repository.CourseModuleRepository;
import com.twojlogin.lms.repository.CourseRepository;
import com.twojlogin.lms.repository.LessonBlockRepository;
import com.twojlogin.lms.repository.LessonRepository;
import com.twojlogin.lms.repository.TaskAttemptRepository;
import com.twojlogin.lms.service.CourseAccessService;
import com.twojlogin.lms.service.InteractiveBlockCompletionService;
import com.twojlogin.lms.service.TaskEvaluationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

@DataJpaTest
class LessonBlockControllerPersistenceTest {

    @Test
    void importsHelloLessonThroughHttpWithDialogsAndVocabulary() throws Exception {
        Course course = new Course();
        course.setName("Angielski");
        course.setCategory("LANGUAGE");
        course = courseRepository.saveAndFlush(course);
        CourseModule module = new CourseModule();
        module.setName("A1");
        module.setCourse(course);
        module = moduleRepository.saveAndFlush(module);
        Lesson lesson = new Lesson();
        lesson.setTitle("Hello!");
        lesson.setOrderIndex(1);
        lesson.setModule(module);
        lesson = lessonRepository.saveAndFlush(lesson);

        byte[] body;
        try (var resource = getClass().getResourceAsStream("/hello-language-import.json")) {
            assertNotNull(resource);
            body = resource.readAllBytes();
        }
        var mvc = org.springframework.test.web.servlet.setup.MockMvcBuilders
                .standaloneSetup(createController())
                .setControllerAdvice(new com.twojlogin.lms.exception.GlobalExceptionHandler())
                .build();
        var result = mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .post("/api/lesson-blocks/lesson/{lessonId}/bulk", lesson.getId())
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content(body))
                .andReturn();
        assertEquals(200, result.getResponse().getStatus(), result.getResponse().getContentAsString());
        assertEquals(17, blockRepository.countByLessonId(lesson.getId()));
    }

    @Autowired
    private LessonBlockRepository blockRepository;

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private TaskAttemptRepository attemptRepository;

    @Autowired
    private CourseRepository courseRepository;

    @Autowired
    private CourseModuleRepository moduleRepository;

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
    void importsMultipleBlocksInOneOrderedBatch() {
        Lesson lesson = createLesson();
        LessonBlockController controller = createController();
        LessonBlockRequest info = request("Co będzie potrzebne?", BlockType.INFO, "Komputer i zeszyt", null);
        LessonBlockRequest quiz = request("Do czego służy BIOS?", BlockType.QUIZ, "Sprzęt\nDokumenty", "Sprzęt");

        List<LessonBlockDto> saved = controller.createBulk(
                lesson.getId(),
                List.of(info, quiz)
        );

        assertEquals(2, saved.size());
        assertEquals(0, saved.get(0).orderIndex());
        assertEquals(1, saved.get(1).orderIndex());
        assertEquals(BlockType.INFO, saved.get(0).type());
        assertEquals(BlockType.QUIZ, saved.get(1).type());
    }

    @Test
    void deletesAllBlocksFromOnlyTheSelectedLesson() {
        Lesson selectedLesson = createLesson();
        Lesson otherLesson = createLesson("Druga lekcja", 2);
        LessonBlockController controller = createController();

        controller.create(selectedLesson.getId(), request("Pierwszy", BlockType.TEXT, "Treść", null));
        controller.create(selectedLesson.getId(), request("Drugi", BlockType.INFO, "Treść", null));
        controller.create(otherLesson.getId(), request("Pozostaje", BlockType.TEXT, "Treść", null));

        Map<String, Integer> result = controller.deleteAllByLesson(selectedLesson.getId());

        assertEquals(2, result.get("deleted"));
        assertEquals(0, blockRepository.countByLessonId(selectedLesson.getId()));
        assertEquals(1, blockRepository.countByLessonId(otherLesson.getId()));
    }

    @Test
    void createsEverySupportedBlockType() {
        LessonBlockController controller = createController();

        for (BlockType type : BlockType.values()) {
            Lesson lesson = createLesson("Lekcja " + type, type.ordinal() + 10);
            String requiredAnswer =
                    type == BlockType.TASK || type == BlockType.QUIZ
                            ? "poprawna odpowiedź"
                            : null;

            String content = switch (type) {
                case DIALOG -> "{\"kind\":\"dialog\",\"turns\":[{\"text\":\"Hello\"},{\"text\":\"Hi\"}]}";
                case VOCABULARY -> "{\"kind\":\"vocabulary\",\"items\":[{\"term\":\"hello\",\"translation\":\"cześć\"}]}";
                case SENTENCE_BUILDER -> "{\"kind\":\"sentence-builder\",\"polishSentence\":\"Dzień dobry\",\"words\":[\"Good\",\"morning\"]}";
                default -> "Treść";
            };

            LessonBlockDto saved = controller.create(
                    lesson.getId(),
                    new LessonBlockRequest(
                            type == BlockType.DIVIDER ? null : "Blok " + type,
                            type,
                            content,
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
                            null,
                            true,
                            5,
                            null
                    )
            );

            assertNotNull(saved.id());
            assertEquals(type.normalized(), saved.type());
        }
    }

    @Test
    void rejectsVocabularyBlockWithMoreThanTwentyItems() {
        Lesson lesson = createLesson();
        LessonBlockController controller = createController();
        String items = IntStream.range(0, 21)
                .mapToObj(index -> "{\"term\":\"word" + index + "\",\"translation\":\"słowo" + index + "\"}")
                .collect(java.util.stream.Collectors.joining(","));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> controller.create(
                        lesson.getId(),
                        request(
                                "Za dużo słówek",
                                BlockType.VOCABULARY,
                                "{\"kind\":\"vocabulary\",\"items\":[" + items + "]}",
                                null
                        )
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        assertEquals(0, blockRepository.countByLessonId(lesson.getId()));
    }

    @Test
    void rejectsAnEleventhBlockInOneLesson() {
        Lesson lesson = createLesson();
        LessonBlockController controller = createController();

        for (int index = 0; index < 10; index++) {
            controller.create(
                    lesson.getId(),
                    request("Blok " + index, BlockType.TEXT, "Treść", null)
            );
        }

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> controller.create(
                        lesson.getId(),
                        request("Za dużo", BlockType.TEXT, "Treść", null)
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        assertEquals(10, blockRepository.countByLessonId(lesson.getId()));
    }

    @Test
    void allowsTwentyBlocksOnlyForLanguageLessons() {
        Course course = new Course();
        course.setName("Angielski");
        course.setCategory("LANGUAGE");
        course = courseRepository.saveAndFlush(course);

        CourseModule module = new CourseModule();
        module.setName("CEFR A1");
        module.setCourse(course);
        module = moduleRepository.saveAndFlush(module);

        Lesson lesson = new Lesson();
        lesson.setTitle("Alfabet angielski");
        lesson.setOrderIndex(1);
        lesson.setModule(module);
        lesson = lessonRepository.saveAndFlush(lesson);
        Long lessonId = lesson.getId();

        LessonBlockController controller = createController();
        List<LessonBlockRequest> requests = IntStream.range(0, 20)
                .mapToObj(index -> request(
                        "Krok " + (index + 1),
                        BlockType.TEXT,
                        "Treść",
                        null
                ))
                .toList();

        List<LessonBlockDto> saved = controller.createBulk(lessonId, requests);

        assertEquals(20, saved.size());
        assertEquals(20, blockRepository.countByLessonId(lessonId));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> controller.create(
                        lessonId,
                        request("Krok 21", BlockType.TEXT, "Treść", null)
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        assertEquals(20, blockRepository.countByLessonId(lessonId));
    }

    @Test
    void rejectsBulkImportThatWouldExceedLessonLimit() {
        Lesson lesson = createLesson();
        LessonBlockController controller = createController();

        for (int index = 0; index < 8; index++) {
            controller.create(
                    lesson.getId(),
                    request("Blok " + index, BlockType.TEXT, "Treść", null)
            );
        }

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> controller.createBulk(
                        lesson.getId(),
                        List.of(
                                request("Pierwszy", BlockType.TEXT, "Treść", null),
                                request("Drugi", BlockType.TEXT, "Treść", null),
                                request("Trzeci", BlockType.TEXT, "Treść", null)
                        )
                )
        );

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        assertEquals(8, blockRepository.countByLessonId(lesson.getId()));
    }

    @Test
    void replacesExistingBlocksWithOneImportedLesson() {
        Lesson lesson = createLesson();
        LessonBlockController controller = createController();

        for (int index = 0; index < 4; index++) {
            controller.create(
                    lesson.getId(),
                    request("Stary blok " + index, BlockType.TEXT, "Stara treść", null)
            );
        }

        List<LessonBlockDto> saved = controller.replaceAll(
                lesson.getId(),
                List.of(
                        request("Nowy materiał", BlockType.TEXT, "Treść", null),
                        request("Nowe ćwiczenie", BlockType.TASK, "Polecenie", "Odpowiedź"),
                        request("Nowe podsumowanie", BlockType.SUMMARY, "Zapamiętaj", null)
                )
        );

        assertEquals(3, saved.size());
        assertEquals(3, blockRepository.countByLessonId(lesson.getId()));
        assertEquals("Nowy materiał", saved.get(0).title());
        assertEquals("Nowe ćwiczenie", saved.get(1).title());
        assertEquals("Nowe podsumowanie", saved.get(2).title());
        assertEquals(List.of(0, 1, 2), saved.stream().map(LessonBlockDto::orderIndex).toList());
    }

    @Test
    void readsHistoricalBlockTypesAsText() {
        Lesson lesson = createLesson();

        for (BlockType legacyType : new BlockType[]{
                BlockType.THEORY,
                BlockType.CONTENT
        }) {
            LessonBlock legacyBlock = new LessonBlock();
            legacyBlock.setLesson(lesson);
            legacyBlock.setTitle("Starszy materiał");
            legacyBlock.setType(legacyType);
            legacyBlock.setContent("Treść");
            legacyBlock.setPublished(true);
            legacyBlock.setPoints(0);
            legacyBlock.setOrderIndex(0);
            blockRepository.saveAndFlush(legacyBlock);
        }

        List<LessonBlockDto> blocks =
                createController().getByLesson(lesson.getId(), null);

        assertEquals(2, blocks.size());
        assertEquals(BlockType.TEXT, blocks.get(0).type());
        assertEquals(BlockType.TEXT, blocks.get(1).type());
    }

    private Lesson createLesson() {
        return createLesson("Pierwsza lekcja", 1);
    }

    private Lesson createLesson(String title, int orderIndex) {
        Lesson lesson = new Lesson();
        lesson.setTitle(title);
        lesson.setOrderIndex(orderIndex);
        return lessonRepository.saveAndFlush(lesson);
    }

    private LessonBlockRequest request(
            String title,
            BlockType type,
            String content,
            String expectedAnswer
    ) {
        return new LessonBlockRequest(
                title,
                type,
                content,
                null,
                type == BlockType.TASK ? content : null,
                null,
                expectedAnswer,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                true,
                0,
                null
        );
    }

    private LessonBlockController createController() {
        return new LessonBlockController(
                blockRepository,
                lessonRepository,
                attemptRepository,
                mock(TaskEvaluationService.class),
                mock(InteractiveBlockCompletionService.class),
                mock(CourseAccessService.class),
                mock(com.twojlogin.lms.repository.LanguageReviewProgressRepository.class)
        );
    }
}

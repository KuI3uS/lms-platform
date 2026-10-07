package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.AnswerRequest;
import com.twojlogin.lms.dto.LessonBlockDto;
import com.twojlogin.lms.dto.LessonBlockRequest;
import com.twojlogin.lms.dto.TaskCheckResponse;
import com.twojlogin.lms.entity.BlockType;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.entity.TaskAttempt;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.LessonBlockRepository;
import com.twojlogin.lms.repository.LessonRepository;
import com.twojlogin.lms.repository.TaskAttemptRepository;
import com.twojlogin.lms.repository.LanguageReviewProgressRepository;
import com.twojlogin.lms.service.TaskEvaluationService;
import com.twojlogin.lms.service.CourseAccessService;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/lesson-blocks")
public class LessonBlockController {

    private final LessonBlockRepository blockRepository;
    private final LessonRepository lessonRepository;
    private final TaskAttemptRepository attemptRepository;
    private final TaskEvaluationService evaluationService;
    private final CourseAccessService accessService;
    private final LanguageReviewProgressRepository reviewRepository;

    public LessonBlockController(
            LessonBlockRepository blockRepository,
            LessonRepository lessonRepository,
            TaskAttemptRepository attemptRepository,
            TaskEvaluationService evaluationService,
            CourseAccessService accessService,
            LanguageReviewProgressRepository reviewRepository
    ) {
        this.blockRepository = blockRepository;
        this.lessonRepository = lessonRepository;
        this.attemptRepository = attemptRepository;
        this.evaluationService = evaluationService;
        this.accessService = accessService;
        this.reviewRepository = reviewRepository;
    }

    @GetMapping("/lesson/{lessonId}")
    public List<LessonBlockDto> getByLesson(
            @PathVariable Long lessonId,
            Authentication authentication
    ) {
        accessService.requireLessonAccess(lessonId, authentication);
        boolean admin = isAdmin(authentication);
        User user = accessService.currentUser(authentication);
        Map<Long, TaskAttempt> attemptsByBlockId = user == null
                ? Map.of()
                : attemptRepository
                    .findByUserIdAndBlockLessonId(user.getId(), lessonId)
                    .stream()
                    .collect(Collectors.toMap(
                            attempt -> attempt.getBlock().getId(),
                            Function.identity()
                    ));

        return blockRepository.findByLessonIdOrderByOrderIndexAsc(lessonId).stream()
                .filter(block -> admin || !Boolean.FALSE.equals(block.getPublished()))
                .map(block -> LessonBlockDto.from(
                        block,
                        admin,
                        attemptsByBlockId.get(block.getId())
                ))
                .toList();
    }

    @GetMapping("/{id}")
    public LessonBlockDto getOne(
            @PathVariable Long id,
            Authentication authentication
    ) {
        LessonBlock block = blockRepository.findById(id).orElseThrow();
        accessService.requireLessonAccess(block.getLesson().getId(), authentication);
        User user = accessService.currentUser(authentication);
        TaskAttempt attempt = user == null
                ? null
                : attemptRepository.findByUserAndBlock(user, block).orElse(null);
        return LessonBlockDto.from(
                block,
                isAdmin(authentication),
                attempt
        );
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/lesson/{lessonId}")
    public LessonBlockDto create(
            @PathVariable Long lessonId,
            @RequestBody LessonBlockRequest request
    ) {

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Nie znaleziono lekcji. Odśwież stronę i spróbuj ponownie."
                ));

        Integer maxOrder =
                blockRepository.findMaxOrderIndexByLessonId(lessonId);

        if (maxOrder == null) {
            maxOrder = -1;
        }

        LessonBlock block = new LessonBlock();
        block.setLesson(lesson);
        block.setOrderIndex(maxOrder + 1);
        applyRequest(block, request, false);

        return LessonBlockDto.from(blockRepository.saveAndFlush(block), true);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/lesson/{lessonId}/bulk")
    public List<LessonBlockDto> createBulk(
            @PathVariable Long lessonId,
            @RequestBody List<LessonBlockRequest> requests
    ) {
        if (requests == null || requests.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Import nie zawiera żadnych bloków."
            );
        }
        if (requests.size() > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Jednorazowo możesz zaimportować maksymalnie 100 bloków."
            );
        }

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Nie znaleziono lekcji. Odśwież stronę i spróbuj ponownie."
                ));
        Integer maxOrder = blockRepository.findMaxOrderIndexByLessonId(lessonId);
        int firstOrder = (maxOrder == null ? -1 : maxOrder) + 1;

        List<LessonBlock> blocks = new java.util.ArrayList<>(requests.size());
        for (int index = 0; index < requests.size(); index++) {
            LessonBlock block = new LessonBlock();
            block.setLesson(lesson);
            block.setOrderIndex(firstOrder + index);
            applyRequest(block, requests.get(index), false);
            blocks.add(block);
        }

        return blockRepository.saveAllAndFlush(blocks).stream()
                .map(block -> LessonBlockDto.from(block, true))
                .toList();
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public LessonBlockDto update(
            @PathVariable Long id,
            @RequestBody LessonBlockRequest request
    ) {

        LessonBlock block = blockRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Nie znaleziono tego bloku lekcji."
                ));

        applyRequest(block, request, true);

        return LessonBlockDto.from(blockRepository.saveAndFlush(block), true);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {

        LessonBlock block = blockRepository.findById(id)
                .orElseThrow();

        Long lessonId = block.getLesson().getId();

        attemptRepository.deleteByBlockId(id);
        reviewRepository.deleteByBlockId(id);
        blockRepository.delete(block);

        List<LessonBlock> blocks =
                blockRepository.findByLessonIdOrderByOrderIndexAsc(lessonId);

        for (int i = 0; i < blocks.size(); i++) {
            blocks.get(i).setOrderIndex(i);
        }

        blockRepository.saveAll(blocks);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/lesson/{lessonId}/reorder")
    public void reorder(
            @PathVariable Long lessonId,
            @RequestBody List<Long> ids
    ) {

        List<LessonBlock> blocks =
                blockRepository.findByLessonIdOrderByOrderIndexAsc(lessonId);

        for (LessonBlock block : blocks) {

            int index = ids.indexOf(block.getId());

            if (index >= 0) {
                block.setOrderIndex(index);
            }

        }

        blockRepository.saveAll(blocks);
    }

    @PostMapping("/{id}/check")
    public TaskCheckResponse check(
            @PathVariable Long id,
            @RequestBody AnswerRequest request,
            Authentication authentication
    ) {
        LessonBlock block = blockRepository.findById(id).orElseThrow();
        User user = accessService.currentUser(authentication);
        accessService.requireLessonAccess(user, block.getLesson());
        return evaluationService.check(block, request.getAnswer(), user);
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }

    private void applyRequest(
            LessonBlock block,
            LessonBlockRequest request,
            boolean allowOrderChange
    ) {
        if (request.type() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Wybierz typ bloku.");
        }
        if (request.type() != BlockType.DIVIDER && isBlank(request.title())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Podaj tytuł bloku.");
        }
        if (request.title() != null && request.title().trim().length() > 255) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Tytuł bloku może mieć maksymalnie 255 znaków."
            );
        }
        if ((request.type() == BlockType.TASK || request.type() == BlockType.QUIZ)
                && isBlank(request.expectedAnswer())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Dodaj poprawną odpowiedź do zadania."
            );
        }

        /*
         * Produkcyjna baza powstawała przez kilka wersji aplikacji. W części
         * starszych schematów opcjonalne kolumny tekstowe nadal mają NOT NULL.
         * Pusty tekst zachowuje znaczenie braku wartości, a jednocześnie pozwala
         * bezpiecznie zapisywać bloki na takim schemacie.
         */
        block.setTitle(trimToEmpty(request.title()));
        block.setType(request.type().normalized());
        block.setContent(trimToEmpty(request.content()));
        block.setDescription(trimToEmpty(request.description()));
        block.setInstruction(trimToEmpty(request.instruction()));
        block.setStarterCode(valueOrEmpty(request.starterCode()));
        block.setExpectedAnswer(valueOrEmpty(request.expectedAnswer()));
        block.setHint(trimToEmpty(request.hint()));
        block.setDetailedHint(trimToEmpty(request.detailedHint()));
        block.setSolutionExplanation(trimToEmpty(request.solutionExplanation()));
        block.setLanguage(trimToEmpty(request.language()));
        block.setHiddenTests(valueOrEmpty(request.hiddenTests()));
        block.setMediaUrl(trimToEmpty(request.mediaUrl()));
        block.setMediaType(trimToEmpty(request.mediaType()));
        block.setPublished(request.published() == null || request.published());
        block.setPoints(Math.max(0, Math.min(
                request.points() == null ? 0 : request.points(),
                1000
        )));

        if (allowOrderChange && request.orderIndex() != null) {
            block.setOrderIndex(Math.max(0, request.orderIndex()));
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String trimToEmpty(String value) {
        if (value == null || value.isBlank()) return "";
        return value.trim();
    }

    private String valueOrEmpty(String value) {
        return value == null ? "" : value;
    }
}

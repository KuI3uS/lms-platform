package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.AnswerRequest;
import com.twojlogin.lms.dto.LessonBlockDto;
import com.twojlogin.lms.dto.LessonBlockRequest;
import com.twojlogin.lms.dto.TaskCheckResponse;
import com.twojlogin.lms.entity.BlockType;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.LessonBlockRepository;
import com.twojlogin.lms.repository.LessonRepository;
import com.twojlogin.lms.repository.TaskAttemptRepository;
import com.twojlogin.lms.service.TaskEvaluationService;
import com.twojlogin.lms.service.CourseAccessService;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/lesson-blocks")
public class LessonBlockController {

    private final LessonBlockRepository blockRepository;
    private final LessonRepository lessonRepository;
    private final TaskAttemptRepository attemptRepository;
    private final TaskEvaluationService evaluationService;
    private final CourseAccessService accessService;

    public LessonBlockController(
            LessonBlockRepository blockRepository,
            LessonRepository lessonRepository,
            TaskAttemptRepository attemptRepository,
            TaskEvaluationService evaluationService,
            CourseAccessService accessService
    ) {
        this.blockRepository = blockRepository;
        this.lessonRepository = lessonRepository;
        this.attemptRepository = attemptRepository;
        this.evaluationService = evaluationService;
        this.accessService = accessService;
    }

    @GetMapping("/lesson/{lessonId}")
    public List<LessonBlockDto> getByLesson(
            @PathVariable Long lessonId,
            Authentication authentication
    ) {
        accessService.requireLessonAccess(lessonId, authentication);
        boolean admin = isAdmin(authentication);

        return blockRepository.findByLessonIdOrderByOrderIndexAsc(lessonId).stream()
                .filter(block -> admin || !Boolean.FALSE.equals(block.getPublished()))
                .map(block -> LessonBlockDto.from(block, admin))
                .toList();
    }

    @GetMapping("/{id}")
    public LessonBlockDto getOne(
            @PathVariable Long id,
            Authentication authentication
    ) {
        LessonBlock block = blockRepository.findById(id).orElseThrow();
        accessService.requireLessonAccess(block.getLesson().getId(), authentication);
        return LessonBlockDto.from(block, isAdmin(authentication));
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

        block.setTitle(trimToNull(request.title()));
        block.setType(request.type());
        block.setContent(trimToNull(request.content()));
        block.setDescription(trimToNull(request.description()));
        block.setInstruction(trimToNull(request.instruction()));
        block.setStarterCode(emptyToNull(request.starterCode()));
        block.setExpectedAnswer(emptyToNull(request.expectedAnswer()));
        block.setHint(trimToNull(request.hint()));
        block.setDetailedHint(trimToNull(request.detailedHint()));
        block.setSolutionExplanation(trimToNull(request.solutionExplanation()));
        block.setLanguage(trimToNull(request.language()));
        block.setMediaUrl(trimToNull(request.mediaUrl()));
        block.setMediaType(trimToNull(request.mediaType()));
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

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) return null;
        return value.trim();
    }

    private String emptyToNull(String value) {
        return value == null || value.isEmpty() ? null : value;
    }
}

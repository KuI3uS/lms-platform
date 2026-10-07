package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.AnswerRequest;
import com.twojlogin.lms.dto.LessonBlockDto;
import com.twojlogin.lms.dto.TaskCheckResponse;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.LessonBlockRepository;
import com.twojlogin.lms.repository.LessonRepository;
import com.twojlogin.lms.repository.TaskAttemptRepository;
import com.twojlogin.lms.service.TaskEvaluationService;
import com.twojlogin.lms.service.CourseAccessService;
import jakarta.transaction.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

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

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/lesson/{lessonId}")
    public LessonBlockDto create(
            @PathVariable Long lessonId,
            @RequestBody LessonBlock block
    ) {

        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow();

        Integer maxOrder =
                blockRepository.findMaxOrderIndexByLessonId(lessonId);

        if (maxOrder == null) {
            maxOrder = -1;
        }

        block.setLesson(lesson);
        block.setOrderIndex(maxOrder + 1);

        if (block.getPublished() == null) {
            block.setPublished(true);
        }

        if (block.getPoints() == null) {
            block.setPoints(0);
        }

        return LessonBlockDto.from(blockRepository.save(block), true);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public LessonBlockDto update(
            @PathVariable Long id,
            @RequestBody LessonBlock updated
    ) {

        LessonBlock block = blockRepository.findById(id)
                .orElseThrow();

        if (updated.getPublished() == null) {
            updated.setPublished(true);
        }

        if (updated.getPoints() == null) {
            updated.setPoints(0);
        }

        block.setTitle(updated.getTitle());
        block.setType(updated.getType());

        block.setContent(updated.getContent());
        block.setDescription(updated.getDescription());
        block.setInstruction(updated.getInstruction());

        block.setStarterCode(updated.getStarterCode());
        block.setExpectedAnswer(updated.getExpectedAnswer());
        block.setHint(updated.getHint());
        block.setDetailedHint(updated.getDetailedHint());
        block.setSolutionExplanation(updated.getSolutionExplanation());
        block.setLanguage(updated.getLanguage());

        block.setMediaUrl(updated.getMediaUrl());
        block.setMediaType(updated.getMediaType());

        block.setOrderIndex(updated.getOrderIndex());
        block.setPublished(updated.getPublished());
        block.setPoints(updated.getPoints());

        return LessonBlockDto.from(blockRepository.save(block), true);
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
}

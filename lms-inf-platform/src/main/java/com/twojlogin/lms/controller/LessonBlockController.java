package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.AnswerRequest;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.repository.LessonBlockRepository;
import com.twojlogin.lms.repository.LessonRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/lesson-blocks")
public class LessonBlockController {

    private final LessonBlockRepository blockRepository;
    private final LessonRepository lessonRepository;

    public LessonBlockController(
            LessonBlockRepository blockRepository,
            LessonRepository lessonRepository
    ) {
        this.blockRepository = blockRepository;
        this.lessonRepository = lessonRepository;
    }

    @GetMapping("/lesson/{lessonId}")
    public List<LessonBlock> getByLesson(@PathVariable Long lessonId) {
        return blockRepository.findByLessonIdOrderByOrderIndexAsc(lessonId);
    }

    @GetMapping("/{id}")
    public LessonBlock getOne(@PathVariable Long id) {
        return blockRepository.findById(id).orElseThrow();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/lesson/{lessonId}")
    public LessonBlock create(
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

        return blockRepository.save(block);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public LessonBlock update(
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
        block.setLanguage(updated.getLanguage());

        block.setMediaUrl(updated.getMediaUrl());
        block.setMediaType(updated.getMediaType());

        block.setOrderIndex(updated.getOrderIndex());
        block.setPublished(updated.getPublished());
        block.setPoints(updated.getPoints());

        return blockRepository.save(block);
    }

    @Transactional
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {

        LessonBlock block = blockRepository.findById(id)
                .orElseThrow();

        Long lessonId = block.getLesson().getId();

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
    public Map<String, Object> check(
            @PathVariable Long id,
            @RequestBody AnswerRequest request
    ) {

        LessonBlock block = blockRepository.findById(id)
                .orElseThrow();

        if (request.getAnswer() == null) {

            return Map.of(
                    "correct", false,
                    "message", "Brak odpowiedzi."
            );

        }

        if (block.getExpectedAnswer() == null
                || block.getExpectedAnswer().isBlank()) {

            return Map.of(
                    "correct", false,
                    "message", "Brak zdefiniowanej poprawnej odpowiedzi."
            );

        }

        String student =
                normalize(request.getAnswer());

        String expected =
                block.getExpectedAnswer();

        String[] requiredParts =
                expected.split("\\n");

        List<String> missing =
                new ArrayList<>();

        for (String part : requiredParts) {

            if (part == null || part.isBlank()) {
                continue;
            }

            String normalized =
                    normalize(part);

            if (!student.contains(normalized)) {
                missing.add(part.trim());
            }

        }

        if (missing.isEmpty()) {

            return Map.of(
                    "correct", true,
                    "message", "Poprawna odpowiedź."
            );

        }

        return Map.of(
                "correct", false,
                "message", "Brakuje wymaganych elementów.",
                "missing", missing
        );
    }

    private String normalize(String code) {

        if (code == null) {
            return "";
        }

        return code
                .trim()
                .replaceAll("\\s+", "")
                .replace("'", "\"")
                .toLowerCase();
    }

}
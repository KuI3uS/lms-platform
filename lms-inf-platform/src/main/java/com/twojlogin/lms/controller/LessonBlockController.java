package com.twojlogin.lms.controller;

import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.repository.LessonBlockRepository;
import com.twojlogin.lms.repository.LessonRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

        Integer maxOrder = blockRepository.findMaxOrderIndexByLessonId(lessonId);

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

        // Podstawowe informacje
        block.setTitle(updated.getTitle());
        block.setType(updated.getType());
        block.setContent(updated.getContent());
        block.setDescription(updated.getDescription());
        block.setInstruction(updated.getInstruction());

        // Kod
        block.setStarterCode(updated.getStarterCode());
        block.setExpectedAnswer(updated.getExpectedAnswer());
        block.setHint(updated.getHint());
        block.setLanguage(updated.getLanguage());

        // Multimedia
        block.setMediaUrl(updated.getMediaUrl());
        block.setMediaType(updated.getMediaType());

        // Ustawienia
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
}
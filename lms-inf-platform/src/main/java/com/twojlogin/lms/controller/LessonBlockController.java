package com.twojlogin.lms.controller;

import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.repository.LessonBlockRepository;
import com.twojlogin.lms.repository.LessonRepository;
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

    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/lesson/{lessonId}")
    public LessonBlock create(
            @PathVariable Long lessonId,
            @RequestBody LessonBlock block
    ) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow();

        int nextOrder = blockRepository.countByLessonId(lessonId);

        block.setLesson(lesson);
        block.setOrderIndex(nextOrder);

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

        block.setTitle(updated.getTitle());
        block.setType(updated.getType());
        block.setContent(updated.getContent());
        block.setOrderIndex(updated.getOrderIndex());
        block.setTaskId(updated.getTaskId());

        return blockRepository.save(block);
    }

    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        blockRepository.deleteById(id);
    }
}
package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.LessonBlockRequest;
import com.twojlogin.lms.dto.StageExportDto;
import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.repository.CourseModuleRepository;
import com.twojlogin.lms.repository.LessonBlockRepository;
import com.twojlogin.lms.repository.LessonRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class StageExportService {
    private final CourseModuleRepository modules;
    private final LessonRepository lessons;
    private final LessonBlockRepository blocks;

    public StageExportService(CourseModuleRepository modules, LessonRepository lessons,
                              LessonBlockRepository blocks) {
        this.modules = modules;
        this.lessons = lessons;
        this.blocks = blocks;
    }

    @Transactional(readOnly = true)
    public StageExportDto export(Long moduleId) {
        var module = modules.findById(moduleId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Nie znaleziono etapu."));
        var course = module.getCourse();
        var courseModules = modules.findByCourseIdOrderByIdAsc(course.getId());
        int number = java.util.stream.IntStream.range(0, courseModules.size())
                .filter(index -> courseModules.get(index).getId().equals(moduleId))
                .findFirst().orElseThrow() + 1;
        var byLesson = blocks.findForStageExport(moduleId).stream()
                .collect(Collectors.groupingBy(block -> block.getLesson().getId()));
        var exportedLessons = lessons.findByModuleIdOrderByOrderIndexAsc(moduleId).stream()
                .map(lesson -> new StageExportDto.ExportLesson(
                        lesson.getTitle(), lesson.getOrderIndex(), lesson.isPublished(),
                        lesson.isFreePreview(), lesson.getTheory(), lesson.getExample(),
                        lesson.getContent(), lesson.getImageUrl(),
                        byLesson.getOrDefault(lesson.getId(), List.of()).stream()
                                .map(StageExportService::exportBlock).toList()))
                .toList();
        return new StageExportDto(1, moduleId, number, module.getName(), module.getSectionTitle(),
                module.getCefrLevel(), module.isLessonsLocked(), course.getId(),
                course.getTitle() == null || course.getTitle().isBlank() ? course.getName() : course.getTitle(),
                course.getContentLanguage(), course.getCategory(), exportedLessons);
    }

    private static LessonBlockRequest exportBlock(LessonBlock block) {
        return new LessonBlockRequest(
                block.getTitle(), block.getType() == null ? null : block.getType().normalized(),
                block.getContent(), block.getDescription(), block.getInstruction(),
                block.getStarterCode(), block.getExpectedAnswer(), block.getHint(),
                block.getDetailedHint(), block.getSolutionExplanation(), block.getLanguage(),
                block.getHiddenTests(), block.getMediaUrl(), block.getMediaType(),
                block.getPublished(), block.getPoints(), block.getOrderIndex());
    }
}

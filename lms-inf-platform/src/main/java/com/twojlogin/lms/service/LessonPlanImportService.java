package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.LessonPlanImportRequest;
import com.twojlogin.lms.dto.LessonPlanImportResult;
import com.twojlogin.lms.entity.CourseModule;
import com.twojlogin.lms.entity.Course;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.repository.CourseModuleRepository;
import com.twojlogin.lms.repository.CourseRepository;
import com.twojlogin.lms.repository.LessonRepository;
import com.twojlogin.lms.util.LessonImportTitles;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class LessonPlanImportService {

    // Limits apply to a single transaction, not to a complete course plan.
    private static final int MAX_STAGES = 20;
    private static final int MAX_LESSONS = 500;
    private static final int MAX_TITLE_LENGTH = 255;

    private final CourseRepository courseRepository;
    private final CourseModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;

    public LessonPlanImportService(
            CourseRepository courseRepository,
            CourseModuleRepository moduleRepository,
            LessonRepository lessonRepository
    ) {
        this.courseRepository = courseRepository;
        this.moduleRepository = moduleRepository;
        this.lessonRepository = lessonRepository;
    }

    @Transactional
    public LessonPlanImportResult importPlan(
            Long courseId,
            LessonPlanImportRequest request
    ) {
        // Serialize imports of this course so two simultaneous requests cannot
        // both create the same titles from the same initial snapshot.
        Course course = courseRepository.findByIdForImport(courseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Kurs nie istnieje"));

        List<LessonPlanImportRequest.StageLessons> requestedStages = request == null
                ? null
                : request.stages();
        if (requestedStages == null || requestedStages.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Plan nie zawiera żadnych etapów z lekcjami"
            );
        }
        if (requestedStages.size() > MAX_STAGES) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Jedna partia może zawierać maksymalnie " + MAX_STAGES + " etapów. Podziel plan na partie."
            );
        }

        List<CourseModule> modules = moduleRepository.findByCourseIdOrderByIdAsc(courseId);
        validateStages(requestedStages, modules.size());
        var targets = resolveStages(course, modules, requestedStages);
        var newModules = targets.stream().filter(StageTarget::created).map(StageTarget::module).toList();
        if (!newModules.isEmpty()) moduleRepository.saveAll(newModules);

        List<Lesson> existingLessons = lessonRepository.findRoadmapLessonsByCourseId(courseId);
        Map<Long, Set<String>> knownTitlesByModule = new HashMap<>();
        Map<Long, Integer> lastOrderByModule = new HashMap<>();
        for (Lesson lesson : existingLessons) {
            Long moduleId = lesson.getModule().getId();
            knownTitlesByModule
                    .computeIfAbsent(moduleId, ignored -> new HashSet<>())
                    .add(normalizeForComparison(lesson.getTitle()));
            lastOrderByModule.merge(
                    moduleId,
                    lesson.getOrderIndex() == null ? 0 : lesson.getOrderIndex(),
                    Math::max
            );
        }

        List<Lesson> lessonsToCreate = new ArrayList<>();
        int duplicatesSkipped = 0;
        int stagesUpdated = 0;

        for (StageTarget target : targets) {
            var requestedStage = target.request();
            CourseModule module = target.module();
            Set<String> knownTitles = knownTitlesByModule.computeIfAbsent(
                    module.getId(),
                    ignored -> new HashSet<>()
            );
            int nextOrder = lastOrderByModule.getOrDefault(module.getId(), 0);
            boolean stageUpdated = false;

            for (String requestedTitle : requestedStage.lessonTitles()) {
                String title = normalizeTitle(requestedTitle);
                String comparisonKey = normalizeForComparison(title);
                if (!knownTitles.add(comparisonKey)) {
                    duplicatesSkipped++;
                    continue;
                }

                Lesson lesson = new Lesson();
                lesson.setModule(module);
                lesson.setTitle(title);
                // Starsze schematy produkcyjnej bazy mają te kolumny jako NOT NULL.
                // Zwykły formularz również zapisuje puste ciągi, więc szkielet z importu
                // powinien zachowywać się dokładnie tak samo.
                lesson.setTheory("");
                lesson.setExample("");
                lesson.setContent("");
                lesson.setImageUrl("");
                lesson.setOrderIndex(++nextOrder);
                lesson.setPublished(false);
                lesson.setFreePreview(false);
                lessonsToCreate.add(lesson);
                stageUpdated = true;
            }

            lastOrderByModule.put(module.getId(), nextOrder);
            if (stageUpdated) stagesUpdated++;
        }

        lessonRepository.saveAll(lessonsToCreate);
        return new LessonPlanImportResult(
                stagesUpdated,
                lessonsToCreate.size(),
                duplicatesSkipped,
                newModules.size()
        );
    }

    private void validateStages(
            List<LessonPlanImportRequest.StageLessons> stages,
            int moduleCount
    ) {
        Set<Integer> stageNumbers = new LinkedHashSet<>();
        int lessonCount = 0;

        for (LessonPlanImportRequest.StageLessons stage : stages) {
            if (stage == null || stage.stageNumber() == null) {
                throw badRequest("Każdy etap musi mieć numer");
            }
            int stageNumber = stage.stageNumber();
            if (stageNumber < 1) throw badRequest("Numer etapu musi być większy od zera");
            if ((stage.stageTitle() == null || stage.stageTitle().isBlank()) && stageNumber > moduleCount) {
                throw badRequest(
                        "Etap " + stageNumber + " nie istnieje w tym kursie. Kurs ma "
                                + moduleCount + " etapów"
                );
            }
            if (!stageNumbers.add(stageNumber)) {
                throw badRequest("Etap " + stageNumber + " występuje w planie więcej niż raz");
            }
            if (stage.stageTitle() != null && !stage.stageTitle().isBlank()) normalizeTitle(stage.stageTitle());
            if (stage.lessonTitles() == null || stage.lessonTitles().isEmpty()) {
                throw badRequest("Etap " + stageNumber + " nie zawiera żadnej lekcji");
            }

            lessonCount += stage.lessonTitles().size();
            if (lessonCount > MAX_LESSONS) {
                throw badRequest(
                        "Jedna partia może zawierać maksymalnie " + MAX_LESSONS + " lekcji. Podziel plan na partie."
                );
            }
            for (String title : stage.lessonTitles()) normalizeTitle(title);
        }
    }

    private List<StageTarget> resolveStages(Course course, List<CourseModule> modules,
                                          List<LessonPlanImportRequest.StageLessons> requests) {
        Map<String, List<CourseModule>> existingByName = new HashMap<>();
        for (var module : modules) {
            existingByName.computeIfAbsent(normalizeForComparison(module.getName()), ignored -> new ArrayList<>()).add(module);
        }
        Set<String> requestedNames = new HashSet<>();
        Set<CourseModule> usedModules = new HashSet<>();
        List<StageTarget> targets = new ArrayList<>();
        for (var request : requests.stream().sorted(java.util.Comparator.comparingInt(LessonPlanImportRequest.StageLessons::stageNumber)).toList()) {
            if (request.stageTitle() == null || request.stageTitle().isBlank()) {
                var module = modules.get(request.stageNumber() - 1);
                if (!usedModules.add(module)) throw badRequest("Ten sam etap występuje w partii więcej niż raz");
                targets.add(new StageTarget(request, module, false));
                continue;
            }
            String name = normalizeTitle(request.stageTitle());
            String key = normalizeForComparison(name);
            if (!requestedNames.add(key)) throw badRequest("Nazwa etapu „" + name + "” występuje w partii więcej niż raz");
            var matches = existingByName.getOrDefault(key, List.of());
            CourseModule module;
            boolean created = matches.isEmpty();
            if (created) {
                module = new CourseModule();
                module.setCourse(course);
                module.setName(name);
                if ("LANGUAGE".equals(course.getCategory())) module.setCefrLevel(course.getCefrLevel());
            } else if (matches.size() == 1) {
                module = matches.get(0);
            } else if (request.stageNumber() <= modules.size() && matches.contains(modules.get(request.stageNumber() - 1))) {
                module = modules.get(request.stageNumber() - 1);
            } else {
                throw badRequest("Nazwa „" + name + "” pasuje do kilku etapów. Nadaj im różne nazwy przed importem.");
            }
            if (!usedModules.add(module)) throw badRequest("Ten sam etap występuje w partii więcej niż raz");
            targets.add(new StageTarget(request, module, created));
        }
        return targets;
    }

    private record StageTarget(LessonPlanImportRequest.StageLessons request, CourseModule module, boolean created) {}

    private String normalizeTitle(String value) {
        if (value == null || value.isBlank()) {
            throw badRequest("Nazwa lekcji nie może być pusta");
        }

        String normalized = value.strip().replaceAll("\\s+", " ");
        if (normalized.length() > MAX_TITLE_LENGTH) {
            throw badRequest(
                    "Nazwa lekcji może mieć maksymalnie " + MAX_TITLE_LENGTH + " znaków"
            );
        }
        return normalized;
    }

    private String normalizeForComparison(String value) {
        return LessonImportTitles.normalize(value);
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}

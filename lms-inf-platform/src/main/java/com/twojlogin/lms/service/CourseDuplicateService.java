package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.CourseDuplicatePreview;
import com.twojlogin.lms.entity.CourseModule;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.repository.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.json.JsonMapper;
import tools.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;

@Service
public class CourseDuplicateService {
    private static final int BATCH_SIZE = 200;
    private static final ObjectMapper JSON = JsonMapper.builder().build();
    private final CourseRepository courses;
    private final CourseModuleRepository modules;
    private final LessonRepository lessons;
    private final LessonBlockRepository blocks;

    public CourseDuplicateService(CourseRepository courses, CourseModuleRepository modules,
                                  LessonRepository lessons, LessonBlockRepository blocks) {
        this.courses = courses;
        this.modules = modules;
        this.lessons = lessons;
        this.blocks = blocks;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public CourseDuplicatePreview preview(Long courseId) {
        return plan(courseId).preview();
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    public CourseDuplicatePreview cleanup(Long courseId, String version) {
        Plan plan = plan(courseId);
        if (version == null || !version.equals(plan.preview().version())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Kurs zmienił się od podglądu. Wyszukaj duplikaty ponownie.");
        }
        // No progress/attempts are deleted. Foreign keys also stop a concurrent
        // attempt from being silently discarded while an unused copy is removed.
        List<Long> lessonIds = new ArrayList<>(plan.lessonIds());
        for (int offset = 0; offset < lessonIds.size(); offset += BATCH_SIZE) {
            List<Long> batch = lessonIds.subList(offset, Math.min(offset + BATCH_SIZE, lessonIds.size()));
            blocks.deleteUnusedByLessonIds(batch);
            lessons.deleteAllByIdInBatch(batch);
        }
        if (!plan.moduleIds().isEmpty()) modules.deleteAllByIdInBatch(plan.moduleIds());

        Set<Long> affectedModules = new HashSet<>();
        plan.allLessons().stream().filter(lesson -> plan.lessonIds().contains(lesson.getId()))
                .forEach(lesson -> affectedModules.add(lesson.getModule().getId()));
        Map<Long, Integer> positions = new HashMap<>();
        for (Lesson lesson : plan.allLessons()) {
            if (plan.lessonIds().contains(lesson.getId())
                    || !affectedModules.contains(lesson.getModule().getId())) continue;
            int position = positions.merge(lesson.getModule().getId(), 1, Integer::sum);
            if (!Objects.equals(lesson.getOrderIndex(), position)) lesson.setOrderIndex(position);
        }
        return plan.preview();
    }

    private Plan plan(Long courseId) {
        if (!courses.existsById(courseId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Kurs nie istnieje");
        }
        List<CourseModule> allModules = modules.findByCourseIdOrderByIdAsc(courseId);
        List<Lesson> allLessons = lessons.findRoadmapLessonsByCourseId(courseId);
        Set<Long> usedLessons = new HashSet<>(lessons.findUsedLessonIdsByCourseId(courseId));
        Set<Long> protectedModules = new HashSet<>(modules.findProtectedModuleIdsByCourseId(courseId));
        Map<Long, List<Lesson>> byModule = new HashMap<>();
        Map<String, List<Lesson>> byTitle = new HashMap<>();
        for (Lesson lesson : allLessons) {
            byModule.computeIfAbsent(lesson.getModule().getId(), ignored -> new ArrayList<>()).add(lesson);
            byTitle.computeIfAbsent(titleKey(lesson.getTitle()), ignored -> new ArrayList<>()).add(lesson);
            if (usedLessons.contains(lesson.getId())) protectedModules.add(lesson.getModule().getId());
        }

        List<Long> candidates = byTitle.values().stream().filter(group -> group.size() > 1)
                .flatMap(Collection::stream).map(Lesson::getId).sorted().toList();
        Map<Long, List<String>> blockHashes = new HashMap<>();
        for (int offset = 0; offset < candidates.size(); offset += BATCH_SIZE) {
            List<Long> batch = candidates.subList(offset, Math.min(offset + BATCH_SIZE, candidates.size()));
            for (Object[] row : blocks.findDuplicateComparisonData(batch)) {
                Long lessonId = ((Number) row[0]).longValue();
                blockHashes.computeIfAbsent(lessonId, ignored -> new ArrayList<>())
                        .add(hash(Arrays.copyOfRange(row, 1, row.length)));
            }
        }
        Map<Long, String> fingerprints = new HashMap<>();
        List<Object> snapshot = new ArrayList<>();
        snapshot.add(courseId);
        for (Lesson lesson : allLessons) {
            String fingerprint = hash(Arrays.asList(titleKey(lesson.getTitle()),
                    text(lesson.getTheory()), text(lesson.getExample()), text(lesson.getContent()),
                    text(lesson.getImageUrl()), lesson.isPublished(), lesson.isFreePreview(),
                    blockHashes.getOrDefault(lesson.getId(), List.of())));
            fingerprints.put(lesson.getId(), fingerprint);
            snapshot.add(Arrays.asList(lesson.getId(), lesson.getModule().getId(),
                    lesson.getTitle(), lesson.getOrderIndex(), fingerprint, usedLessons.contains(lesson.getId())));
        }

        Map<String, List<CourseModule>> moduleGroups = new LinkedHashMap<>();
        Map<Long, Integer> stageNumbers = new HashMap<>();
        for (int index = 0; index < allModules.size(); index++) {
            CourseModule module = allModules.get(index);
            stageNumbers.put(module.getId(), index + 1);
            List<String> lessonKeys = byModule.getOrDefault(module.getId(), List.of()).stream()
                    .map(lesson -> fingerprints.get(lesson.getId())).distinct().toList();
            String key = hash(Arrays.asList(titleKey(module.getName()), text(module.getSectionTitle()),
                    module.isLessonsLocked(), module.getCefrLevel(), lessonKeys));
            snapshot.add(Arrays.asList(module.getId(), module.getName(), key,
                    protectedModules.contains(module.getId())));
            // Blank titles never identify a duplicate.
            if (!titleKey(module.getName()).isEmpty()) {
                moduleGroups.computeIfAbsent(key, ignored -> new ArrayList<>()).add(module);
            }
        }

        Set<Long> moduleIds = new LinkedHashSet<>();
        Set<Long> lessonIds = new LinkedHashSet<>();
        List<CourseDuplicatePreview.Group> groups = new ArrayList<>();
        int protectedCount = 0;
        for (List<CourseModule> group : moduleGroups.values()) {
            if (group.size() < 2) continue;
            CourseModule kept = group.stream().filter(module -> protectedModules.contains(module.getId()))
                    .findFirst().orElse(group.get(0));
            List<Long> copies = new ArrayList<>();
            int skipped = 0;
            for (CourseModule module : group) {
                if (module == kept) continue;
                if (protectedModules.contains(module.getId())) { skipped++; continue; }
                copies.add(module.getId());
                moduleIds.add(module.getId());
                byModule.getOrDefault(module.getId(), List.of()).forEach(lesson -> lessonIds.add(lesson.getId()));
            }
            groups.add(new CourseDuplicatePreview.Group("MODULE", kept.getName(),
                    stageNumbers.get(kept.getId()), kept.getId(), copies, skipped));
            protectedCount += skipped;
        }

        for (CourseModule module : allModules) {
            if (moduleIds.contains(module.getId())) continue;
            Map<String, List<Lesson>> lessonGroups = new LinkedHashMap<>();
            for (Lesson lesson : byModule.getOrDefault(module.getId(), List.of())) {
                if (!titleKey(lesson.getTitle()).isEmpty()) lessonGroups
                        .computeIfAbsent(fingerprints.get(lesson.getId()), ignored -> new ArrayList<>()).add(lesson);
            }
            for (List<Lesson> group : lessonGroups.values()) {
                if (group.size() < 2) continue;
                Lesson kept = group.stream().filter(lesson -> usedLessons.contains(lesson.getId()))
                        .findFirst().orElse(group.get(0));
                List<Long> copies = new ArrayList<>();
                int skipped = 0;
                for (Lesson lesson : group) {
                    if (lesson == kept) continue;
                    if (usedLessons.contains(lesson.getId())) { skipped++; continue; }
                    copies.add(lesson.getId());
                    lessonIds.add(lesson.getId());
                }
                groups.add(new CourseDuplicatePreview.Group("LESSON", kept.getTitle(),
                        stageNumbers.get(module.getId()), kept.getId(), copies, skipped));
                protectedCount += skipped;
            }
        }
        CourseDuplicatePreview preview = new CourseDuplicatePreview(hash(snapshot), moduleIds.size(),
                lessonIds.size(), protectedCount, groups);
        return new Plan(preview, moduleIds, lessonIds, allLessons);
    }

    private static String titleKey(String value) {
        return text(value).strip().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
    }

    private static String text(String value) { return value == null ? "" : value; }

    private static String hash(Object value) {
        try {
            String json = JSON.writeValueAsString(value);
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(json.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private record Plan(CourseDuplicatePreview preview, Set<Long> moduleIds,
                        Set<Long> lessonIds, List<Lesson> allLessons) {}
}

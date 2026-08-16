package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.LanguagePathDto;
import com.twojlogin.lms.entity.Course;
import com.twojlogin.lms.entity.ExamAttempt;
import com.twojlogin.lms.entity.ExamAttemptStatus;
import com.twojlogin.lms.entity.ExamType;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.entity.Question;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.ExamAttemptRepository;
import com.twojlogin.lms.repository.LessonProgressRepository;
import com.twojlogin.lms.repository.LessonRepository;
import com.twojlogin.lms.repository.QuestionRepository;
import com.twojlogin.lms.util.CefrLevels;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
public class LanguageProgressService {

    public static final int MIN_LEVEL_EXAM_QUESTIONS = 10;

    private final ExamAttemptRepository attemptRepository;
    private final LessonRepository lessonRepository;
    private final LessonProgressRepository progressRepository;
    private final QuestionRepository questionRepository;

    public LanguageProgressService(
            ExamAttemptRepository attemptRepository,
            LessonRepository lessonRepository,
            LessonProgressRepository progressRepository,
            QuestionRepository questionRepository
    ) {
        this.attemptRepository = attemptRepository;
        this.lessonRepository = lessonRepository;
        this.progressRepository = progressRepository;
        this.questionRepository = questionRepository;
    }

    public boolean isLanguageCourse(Course course) {
        return course != null && "LANGUAGE".equals(course.getCategory());
    }

    public String startLevel(Course course) {
        String level = CefrLevels.normalize(course.getCefrLevel());
        return level == null ? "A1" : level;
    }

    public String endLevel(Course course) {
        String start = startLevel(course);
        String end = CefrLevels.normalize(course.getCefrEndLevel());
        return end == null || CefrLevels.rank(end) < CefrLevels.rank(start) ? start : end;
    }

    @Transactional(readOnly = true)
    public String unlockedLevel(User user, Course course) {
        if (!isLanguageCourse(course)) return null;
        if (user == null) return startLevel(course);
        return unlockedLevel(course, passedAttempts(user, course));
    }

    private String unlockedLevel(Course course, List<ExamAttempt> passed) {
        String unlocked = startLevel(course);
        for (ExamAttempt attempt : passed) {
            String level = CefrLevels.normalize(attempt.getCefrLevel());
            if (level == null) continue;

            String candidate = attempt.getExamType() == ExamType.LEVEL_FINAL
                    ? CefrLevels.next(level)
                    : attempt.getExamType() == ExamType.PLACEMENT ? level : null;
            if (candidate != null
                    && CefrLevels.isInRange(candidate, startLevel(course), endLevel(course))
                    && CefrLevels.rank(candidate) > CefrLevels.rank(unlocked)) {
                unlocked = candidate;
            }
        }
        return unlocked;
    }

    @Transactional(readOnly = true)
    public boolean isLevelUnlocked(User user, Course course, String level) {
        if (!isLanguageCourse(course)) return true;
        return CefrLevels.rank(level) <= CefrLevels.rank(unlockedLevel(user, course));
    }

    @Transactional(readOnly = true)
    public boolean isCourseworkCompleted(User user, Course course, String level) {
        List<Lesson> levelLessons = lessonsForLevel(course, level);
        if (levelLessons.isEmpty()) return false;
        Set<Long> completed = Set.copyOf(
                progressRepository.findCompletedLessonIdsByUserIdAndCourseId(
                        user.getId(), course.getId()
                )
        );
        return levelLessons.stream().allMatch(lesson -> completed.contains(lesson.getId()));
    }

    @Transactional(readOnly = true)
    public List<Question> questionsForLevel(Course course, String level) {
        String normalized = CefrLevels.normalize(level);
        return questionRepository.findByModuleCourseId(course.getId()).stream()
                .filter(question -> normalized != null
                        && normalized.equals(question.getModule().getCefrLevel()))
                .toList();
    }

    @Transactional(readOnly = true)
    public LanguagePathDto describe(User user, Course course, boolean admin) {
        String start = startLevel(course);
        String end = endLevel(course);
        List<ExamAttempt> attempts = passedAttempts(user, course);
        String unlocked = admin ? end : unlockedLevel(course, attempts);
        List<Lesson> lessons = lessonRepository.findRoadmapLessonsByCourseId(course.getId());
        Set<Long> completedIds = Set.copyOf(
                progressRepository.findCompletedLessonIdsByUserIdAndCourseId(
                        user.getId(), course.getId()
                )
        );
        List<Question> questions = questionRepository.findByModuleCourseId(course.getId());
        int placementRank = attempts.stream()
                .filter(attempt -> attempt.getExamType() == ExamType.PLACEMENT)
                .map(ExamAttempt::getCefrLevel)
                .mapToInt(CefrLevels::rank)
                .max()
                .orElse(-1);
        List<LanguagePathDto.LevelItem> levels = CefrLevels.between(start, end).stream()
                .map(level -> {
                    long lessonCount = lessons.stream()
                            .filter(lesson -> level.equals(lesson.getModule().getCefrLevel()))
                            .count();
                    long completedCount = lessons.stream()
                            .filter(lesson -> level.equals(lesson.getModule().getCefrLevel()))
                            .filter(lesson -> completedIds.contains(lesson.getId()))
                            .count();
                    long questionCount = questions.stream()
                            .filter(question -> level.equals(question.getModule().getCefrLevel()))
                            .count();
                    boolean finalPassed = hasPassed(attempts, ExamType.LEVEL_FINAL, level);
                    boolean placementPassed = hasPassed(attempts, ExamType.PLACEMENT, level);
                    boolean skippedByPlacement = CefrLevels.rank(level) < placementRank;
                    boolean levelUnlocked = admin
                            || CefrLevels.rank(level) <= CefrLevels.rank(unlocked);
                    boolean courseworkCompleted = lessonCount > 0 && completedCount == lessonCount;
                    boolean enoughQuestions = questionCount >= MIN_LEVEL_EXAM_QUESTIONS;

                    return new LanguagePathDto.LevelItem(
                            level,
                            levelUnlocked,
                            lessonCount,
                            completedCount,
                            courseworkCompleted,
                            finalPassed,
                            placementPassed,
                            skippedByPlacement,
                            questionCount,
                            levelUnlocked && courseworkCompleted && !finalPassed
                                    && !skippedByPlacement && enoughQuestions,
                            !admin && CefrLevels.rank(level) > CefrLevels.rank(unlocked)
                                    && enoughQuestions
                    );
                })
                .toList();

        boolean completed = levels.stream()
                .filter(level -> level.level().equals(end))
                .anyMatch(LanguagePathDto.LevelItem::finalExamPassed);

        return new LanguagePathDto(
                course.getId(),
                course.getTitle() == null ? course.getName() : course.getTitle(),
                course.getCourseLanguage(),
                start,
                end,
                unlocked,
                completed,
                levels
        );
    }

    private List<Lesson> lessonsForLevel(Course course, String level) {
        String normalized = CefrLevels.normalize(level);
        return lessonRepository.findRoadmapLessonsByCourseId(course.getId()).stream()
                .filter(lesson -> normalized != null
                        && normalized.equals(lesson.getModule().getCefrLevel()))
                .toList();
    }

    private List<ExamAttempt> passedAttempts(User user, Course course) {
        return attemptRepository
                .findByUserIdAndCourseIdAndStatusAndPassedTrueOrderByStartedAtDesc(
                        user.getId(), course.getId(), ExamAttemptStatus.SUBMITTED
                );
    }

    private boolean hasPassed(List<ExamAttempt> attempts, ExamType type, String level) {
        return attempts.stream().anyMatch(attempt -> attempt.getExamType() == type
                && level.equals(CefrLevels.normalize(attempt.getCefrLevel())));
    }
}

package com.twojlogin.lms.service;

import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.repository.CourseModuleRepository;
import com.twojlogin.lms.repository.LanguageReviewProgressRepository;
import com.twojlogin.lms.repository.LessonProgressRepository;
import com.twojlogin.lms.repository.LessonRepository;
import com.twojlogin.lms.repository.LessonSubmissionRepository;
import com.twojlogin.lms.repository.QuestionRepository;
import com.twojlogin.lms.repository.SubmissionRepository;
import com.twojlogin.lms.repository.TaskAttemptRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class CourseModuleDeletionService {

    private final CourseModuleRepository moduleRepository;
    private final LessonRepository lessonRepository;
    private final LessonSubmissionRepository lessonSubmissionRepository;
    private final LessonProgressRepository lessonProgressRepository;
    private final TaskAttemptRepository taskAttemptRepository;
    private final LanguageReviewProgressRepository reviewRepository;
    private final SubmissionRepository submissionRepository;
    private final QuestionRepository questionRepository;

    public CourseModuleDeletionService(
            CourseModuleRepository moduleRepository,
            LessonRepository lessonRepository,
            LessonSubmissionRepository lessonSubmissionRepository,
            LessonProgressRepository lessonProgressRepository,
            TaskAttemptRepository taskAttemptRepository,
            LanguageReviewProgressRepository reviewRepository,
            SubmissionRepository submissionRepository,
            QuestionRepository questionRepository
    ) {
        this.moduleRepository = moduleRepository;
        this.lessonRepository = lessonRepository;
        this.lessonSubmissionRepository = lessonSubmissionRepository;
        this.lessonProgressRepository = lessonProgressRepository;
        this.taskAttemptRepository = taskAttemptRepository;
        this.reviewRepository = reviewRepository;
        this.submissionRepository = submissionRepository;
        this.questionRepository = questionRepository;
    }

    @Transactional
    public void delete(Long moduleId) {
        if (!moduleRepository.existsById(moduleId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Moduł nie istnieje");
        }

        List<Lesson> lessons = lessonRepository.findByModuleIdOrderByOrderIndexAsc(moduleId);
        for (Lesson lesson : lessons) {
            Long lessonId = lesson.getId();
            lessonSubmissionRepository.deleteByLessonId(lessonId);
            taskAttemptRepository.deleteByBlockLessonId(lessonId);
            reviewRepository.deleteByBlockLessonId(lessonId);
            lessonProgressRepository.deleteByLessonId(lessonId);
        }

        lessonRepository.deleteAll(lessons);
        lessonRepository.flush();
        submissionRepository.deleteByModuleId(moduleId);
        questionRepository.deleteAll(questionRepository.findByModuleId(moduleId));
        moduleRepository.deleteById(moduleId);
    }
}

package com.twojlogin.lms.service;

import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.entity.Question;
import com.twojlogin.lms.repository.CourseModuleRepository;
import com.twojlogin.lms.repository.LanguageReviewProgressRepository;
import com.twojlogin.lms.repository.LessonProgressRepository;
import com.twojlogin.lms.repository.LessonRepository;
import com.twojlogin.lms.repository.LessonSubmissionRepository;
import com.twojlogin.lms.repository.QuestionRepository;
import com.twojlogin.lms.repository.SubmissionRepository;
import com.twojlogin.lms.repository.TaskAttemptRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CourseModuleDeletionServiceTest {

    @Test
    void deletesAllModuleContentBeforeDeletingModule() {
        CourseModuleRepository moduleRepository = mock(CourseModuleRepository.class);
        LessonRepository lessonRepository = mock(LessonRepository.class);
        LessonSubmissionRepository submissionRepository = mock(LessonSubmissionRepository.class);
        LessonProgressRepository progressRepository = mock(LessonProgressRepository.class);
        TaskAttemptRepository attemptRepository = mock(TaskAttemptRepository.class);
        LanguageReviewProgressRepository reviewRepository = mock(LanguageReviewProgressRepository.class);
        SubmissionRepository examSubmissionRepository = mock(SubmissionRepository.class);
        QuestionRepository questionRepository = mock(QuestionRepository.class);

        Lesson firstLesson = new Lesson();
        firstLesson.setId(21L);
        Lesson secondLesson = new Lesson();
        secondLesson.setId(22L);
        List<Lesson> lessons = List.of(firstLesson, secondLesson);
        List<Question> questions = List.of(new Question());

        when(moduleRepository.existsById(7L)).thenReturn(true);
        when(lessonRepository.findByModuleIdOrderByOrderIndexAsc(7L)).thenReturn(lessons);
        when(questionRepository.findByModuleId(7L)).thenReturn(questions);

        CourseModuleDeletionService service = new CourseModuleDeletionService(
                moduleRepository,
                lessonRepository,
                submissionRepository,
                progressRepository,
                attemptRepository,
                reviewRepository,
                examSubmissionRepository,
                questionRepository
        );

        service.delete(7L);

        for (Long lessonId : List.of(21L, 22L)) {
            verify(submissionRepository).deleteByLessonId(lessonId);
            verify(attemptRepository).deleteByBlockLessonId(lessonId);
            verify(reviewRepository).deleteByBlockLessonId(lessonId);
            verify(progressRepository).deleteByLessonId(lessonId);
        }
        verify(lessonRepository).deleteAll(lessons);
        verify(lessonRepository).flush();
        verify(examSubmissionRepository).deleteByModuleId(7L);
        verify(questionRepository).deleteAll(questions);

        verify(moduleRepository).deleteById(7L);
    }
}

package com.twojlogin.lms.service;

import com.twojlogin.lms.dto.*;
import com.twojlogin.lms.entity.*;
import com.twojlogin.lms.repository.ExamAttemptRepository;
import com.twojlogin.lms.repository.QuestionRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ExamService {

    private static final int DEFAULT_QUESTION_COUNT = 20;
    private static final int DEFAULT_DURATION_MINUTES = 40;
    private static final double PASSING_PERCENTAGE = 50.0;
    private static final int SUBMISSION_GRACE_SECONDS = 5;

    private final ExamAttemptRepository attemptRepository;
    private final QuestionRepository questionRepository;
    private final CourseAccessService accessService;
    private final NotificationService notificationService;
    private final AchievementService achievementService;

    public ExamService(
            ExamAttemptRepository attemptRepository,
            QuestionRepository questionRepository,
            CourseAccessService accessService,
            NotificationService notificationService,
            AchievementService achievementService
    ) {
        this.attemptRepository = attemptRepository;
        this.questionRepository = questionRepository;
        this.accessService = accessService;
        this.notificationService = notificationService;
        this.achievementService = achievementService;
    }

    @Transactional
    public ExamAttemptDto start(
            ExamStartRequest request,
            Authentication authentication
    ) {
        if (request == null || request.courseId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Wybierz kurs egzaminacyjny");
        }

        User user = accessService.currentUser(authentication);
        Course course = accessService.requireCourseAccess(request.courseId(), authentication);
        List<Question> availableQuestions = new ArrayList<>(
                questionRepository.findByModuleCourseId(course.getId())
        );

        if (availableQuestions.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Ten kurs nie ma jeszcze pytań egzaminacyjnych"
            );
        }

        int requestedCount = request.questionCount() == null
                ? DEFAULT_QUESTION_COUNT
                : request.questionCount();
        int questionCount = Math.min(
                availableQuestions.size(),
                Math.max(1, Math.min(requestedCount, 40))
        );
        int durationMinutes = request.durationMinutes() == null
                ? DEFAULT_DURATION_MINUTES
                : Math.max(5, Math.min(request.durationMinutes(), 180));

        Collections.shuffle(availableQuestions, new SecureRandom());
        List<Question> selected = availableQuestions.subList(0, questionCount);
        LocalDateTime now = LocalDateTime.now();

        ExamAttempt attempt = new ExamAttempt();
        attempt.setPublicId(UUID.randomUUID().toString());
        attempt.setUser(user);
        attempt.setCourse(course);
        attempt.setStatus(ExamAttemptStatus.IN_PROGRESS);
        attempt.setDurationMinutes(durationMinutes);
        attempt.setTotalQuestions(questionCount);
        attempt.setStartedAt(now);
        attempt.setExpiresAt(now.plusMinutes(durationMinutes));

        List<ExamAttemptQuestion> attemptQuestions = new ArrayList<>();
        for (int index = 0; index < selected.size(); index++) {
            ExamAttemptQuestion attemptQuestion = new ExamAttemptQuestion();
            attemptQuestion.setAttempt(attempt);
            attemptQuestion.setQuestion(selected.get(index));
            attemptQuestion.setPosition(index + 1);
            attemptQuestions.add(attemptQuestion);
        }
        attempt.setQuestions(attemptQuestions);

        return toDto(attemptRepository.save(attempt), true);
    }

    @Transactional
    public ExamAttemptDto get(String publicId, Authentication authentication) {
        User user = accessService.currentUser(authentication);
        ExamAttempt attempt = findOwned(publicId, user);
        expireIfNeeded(attempt);
        return toDto(attempt, attempt.getStatus() == ExamAttemptStatus.IN_PROGRESS);
    }

    @Transactional(readOnly = true)
    public List<ExamAttemptDto> history(Authentication authentication) {
        User user = accessService.currentUser(authentication);
        return attemptRepository.findByUserIdOrderByStartedAtDesc(user.getId()).stream()
                .map(attempt -> toDto(attempt, false))
                .toList();
    }

    @Transactional
    public ExamAttemptDto submit(
            String publicId,
            ExamSubmitRequest request,
            Authentication authentication
    ) {
        User user = accessService.currentUser(authentication);
        ExamAttempt attempt = findOwned(publicId, user);
        expireIfNeeded(attempt);

        if (attempt.getStatus() == ExamAttemptStatus.EXPIRED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Czas egzaminu minął");
        }
        if (attempt.getStatus() != ExamAttemptStatus.IN_PROGRESS) {
            return toDto(attempt, false);
        }

        Map<Long, ExamAnswerRequest> submittedAnswers = request == null
                || request.answers() == null
                ? Map.of()
                : request.answers().stream()
                        .filter(answer -> answer.questionId() != null)
                        .collect(Collectors.toMap(
                                ExamAnswerRequest::questionId,
                                Function.identity(),
                                (first, ignored) -> first
                        ));

        int correct = 0;
        for (ExamAttemptQuestion attemptQuestion : attempt.getQuestions()) {
            Question question = attemptQuestion.getQuestion();
            ExamAnswerRequest submitted = submittedAnswers.get(question.getId());
            if (submitted == null || submitted.answerId() == null) continue;

            Answer selectedAnswer = question.getAnswers().stream()
                    .filter(answer -> answer.getId().equals(submitted.answerId()))
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "Wybrana odpowiedź nie należy do pytania"
                    ));
            attemptQuestion.setSelectedAnswerId(selectedAnswer.getId());
            attemptQuestion.setAnsweredCorrectly(selectedAnswer.isCorrect());
            if (selectedAnswer.isCorrect()) correct++;
        }

        double percentage = attempt.getTotalQuestions() == 0
                ? 0
                : correct * 100.0 / attempt.getTotalQuestions();
        attempt.setCorrectAnswers(correct);
        attempt.setPercentage(Math.round(percentage * 10.0) / 10.0);
        attempt.setPassed(percentage >= PASSING_PERCENTAGE);
        attempt.setTabSwitchCount(request == null ? 0 : Math.max(0, request.tabSwitchCount()));
        attempt.setStatus(ExamAttemptStatus.SUBMITTED);
        attempt.setSubmittedAt(LocalDateTime.now());

        ExamAttempt saved = attemptRepository.save(attempt);
        notificationService.create(
                user,
                NotificationType.EXAM_RESULT,
                saved.isPassed() ? "Egzamin zaliczony" : "Egzamin zakończony",
                "Twój wynik z „" + courseTitle(saved.getCourse()) + "” to "
                        + saved.getPercentage() + "%.",
                "/exams"
        );
        achievementService.evaluate(user);
        return toDto(saved, false);
    }

    private ExamAttempt findOwned(String publicId, User user) {
        ExamAttempt attempt = attemptRepository.findByPublicId(publicId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Nie znaleziono egzaminu"
                ));
        if (!attempt.getUser().getId().equals(user.getId()) && !accessService.isAdmin(user)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Brak dostępu do egzaminu");
        }
        return attempt;
    }

    private void expireIfNeeded(ExamAttempt attempt) {
        if (attempt.getStatus() == ExamAttemptStatus.IN_PROGRESS
                && LocalDateTime.now().isAfter(
                        attempt.getExpiresAt().plusSeconds(SUBMISSION_GRACE_SECONDS)
                )) {
            attempt.setStatus(ExamAttemptStatus.EXPIRED);
            attempt.setSubmittedAt(attempt.getExpiresAt());
            attemptRepository.save(attempt);
        }
    }

    private ExamAttemptDto toDto(ExamAttempt attempt, boolean includeQuestionsFlag) {
        List<QuestionDto> questions = includeQuestionsFlag
                ? attempt.getQuestions().stream()
                        .map(ExamAttemptQuestion::getQuestion)
                        .map(QuestionDto::from)
                        .toList()
                : List.of();

        return new ExamAttemptDto(
                attempt.getPublicId(),
                attempt.getCourse().getId(),
                courseTitle(attempt.getCourse()),
                attempt.getStatus(),
                attempt.getDurationMinutes(),
                attempt.getTotalQuestions(),
                attempt.getCorrectAnswers(),
                attempt.getPercentage(),
                attempt.isPassed(),
                attempt.getTabSwitchCount(),
                attempt.getStartedAt(),
                attempt.getExpiresAt(),
                attempt.getSubmittedAt(),
                questions
        );
    }

    private String courseTitle(Course course) {
        return course.getTitle() == null ? course.getName() : course.getTitle();
    }
}

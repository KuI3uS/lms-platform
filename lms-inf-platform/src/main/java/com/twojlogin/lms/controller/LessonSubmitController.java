package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.LessonSubmitRequest;
import com.twojlogin.lms.dto.TaskAnswerDto;
import com.twojlogin.lms.entity.*;
import com.twojlogin.lms.repository.LessonRepository;
import com.twojlogin.lms.repository.LessonSubmissionRepository;
import com.twojlogin.lms.repository.TaskRepository;
import com.twojlogin.lms.repository.UserRepository;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/lesson-submit")
public class LessonSubmitController {

    private final JavaMailSender mailSender;
    private final UserRepository userRepository;
    private final LessonRepository lessonRepository;
    private final TaskRepository taskRepository;
    private final LessonSubmissionRepository submissionRepository;

    public LessonSubmitController(
            JavaMailSender mailSender,
            UserRepository userRepository,
            LessonRepository lessonRepository,
            TaskRepository taskRepository,
            LessonSubmissionRepository submissionRepository
    ) {
        this.mailSender = mailSender;
        this.userRepository = userRepository;
        this.lessonRepository = lessonRepository;
        this.taskRepository = taskRepository;
        this.submissionRepository = submissionRepository;
    }

    @PostMapping
    public void submitLesson(@RequestBody LessonSubmitRequest request) {

        // ===== USER =====

        UserDetails userDetails = (UserDetails)
                SecurityContextHolder.getContext()
                        .getAuthentication()
                        .getPrincipal();

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow();

        // ===== LESSON =====

        Lesson lesson = lessonRepository.findById(request.getLessonId())
                .orElseThrow();

        // ===== SUBMISSION =====

        LessonSubmission submission = new LessonSubmission();

        submission.setUser(user);
        submission.setLesson(lesson);

        submission.setSubmittedAt(LocalDateTime.now());

        submission.setStatus("NEW");

        // ===== ANSWERS =====

        List<LessonSubmissionAnswer> savedAnswers = new ArrayList<>();

        for (TaskAnswerDto dto : request.getAnswers()) {

            Task task = taskRepository.findById(dto.getTaskId())
                    .orElseThrow();

            LessonSubmissionAnswer answer = new LessonSubmissionAnswer();

            answer.setSubmission(submission);

            answer.setTaskId(task.getId());

            answer.setTaskContent(task.getInstruction());

            answer.setStudentAnswer(dto.getStudentAnswer());

            answer.setExpectedAnswer(task.getExpectedAnswer());

            boolean correct =
                    task.getExpectedAnswer() != null
                            && dto.getStudentAnswer() != null
                            && task.getExpectedAnswer()
                            .trim()
                            .equalsIgnoreCase(dto.getStudentAnswer().trim());

            answer.setCorrect(correct);

            savedAnswers.add(answer);
        }

        submission.setAnswers(savedAnswers);

        submissionRepository.save(submission);

        // ===== EMAIL =====

        StringBuilder body = new StringBuilder();

        body.append("Uczeń przesłał rozwiązania lekcji\n\n");

        body.append("Uczeń: ")
                .append(user.getEmail())
                .append("\n");

        body.append("Lekcja: ")
                .append(lesson.getTitle())
                .append("\n\n");

        int i = 1;

        for (LessonSubmissionAnswer a : savedAnswers) {

            body.append("Zadanie ")
                    .append(i)
                    .append("\n");

            body.append("Treść: ")
                    .append(a.getTaskContent())
                    .append("\n");

            body.append("Odpowiedź ucznia:\n")
                    .append(a.getStudentAnswer())
                    .append("\n");

            body.append("Poprawna odpowiedź:\n")
                    .append(a.getExpectedAnswer())
                    .append("\n");

            body.append("Wynik: ")
                    .append(a.getCorrect() ? "POPRAWNA" : "BŁĘDNA")
                    .append("\n");

            body.append("---------------------\n\n");

            i++;
        }

        SimpleMailMessage message = new SimpleMailMessage();

        message.setTo("jakub.marcinkowski.p@mojcosinus.pl");

        message.setSubject(
                "Nowe rozwiązanie lekcji - " + lesson.getTitle()
        );

        message.setText(body.toString());

        mailSender.send(message);
    }
}
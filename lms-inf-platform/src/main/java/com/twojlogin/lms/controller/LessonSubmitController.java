package com.twojlogin.lms.controller;

import com.twojlogin.lms.dto.LessonSubmitRequest;
import com.twojlogin.lms.entity.Lesson;
import com.twojlogin.lms.entity.LessonBlock;
import com.twojlogin.lms.entity.LessonSubmission;
import com.twojlogin.lms.entity.LessonSubmissionAnswer;
import com.twojlogin.lms.entity.User;
import com.twojlogin.lms.repository.LessonBlockRepository;
import com.twojlogin.lms.repository.LessonRepository;
import com.twojlogin.lms.repository.LessonSubmissionRepository;
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
    private final LessonBlockRepository lessonBlockRepository;
    private final LessonSubmissionRepository submissionRepository;

    public LessonSubmitController(
            JavaMailSender mailSender,
            UserRepository userRepository,
            LessonRepository lessonRepository,
            LessonBlockRepository lessonBlockRepository,
            LessonSubmissionRepository submissionRepository
    ) {
        this.mailSender = mailSender;
        this.userRepository = userRepository;
        this.lessonRepository = lessonRepository;
        this.lessonBlockRepository = lessonBlockRepository;
        this.submissionRepository = submissionRepository;
    }

    @PostMapping
    public void submitLesson(
            @RequestBody LessonSubmitRequest request
    ) {

        UserDetails userDetails =
                (UserDetails) SecurityContextHolder
                        .getContext()
                        .getAuthentication()
                        .getPrincipal();

        User user = userRepository
                .findByEmail(userDetails.getUsername())
                .orElseThrow();

        Lesson lesson = lessonRepository
                .findById(request.getLessonId())
                .orElseThrow();

        LessonSubmission submission = new LessonSubmission();

        submission.setUser(user);
        submission.setLesson(lesson);
        submission.setSubmittedAt(LocalDateTime.now());
        submission.setStatus("NEW");

        List<LessonSubmissionAnswer> savedAnswers = new ArrayList<>();

        for (LessonSubmissionAnswer dto : request.getAnswers()) {

            LessonBlock block =
                    lessonBlockRepository.findById(dto.getBlockId())
                            .orElseThrow();

            LessonSubmissionAnswer answer =
                    new LessonSubmissionAnswer();

            answer.setSubmission(submission);

            answer.setBlockId(block.getId());

            answer.setTaskContent(block.getTitle());

            answer.setInstruction(dto.getInstruction());

            answer.setExpectedAnswer(
                    block.getExpectedAnswer()
            );

            boolean correct = false;

            if (block.getExpectedAnswer() != null
                    && dto.getInstruction() != null) {

                String expected =
                        normalize(block.getExpectedAnswer());

                String student =
                        normalize(dto.getInstruction());

                correct = student.contains(expected);
            }

            answer.setCorrect(correct);

            savedAnswers.add(answer);
        }

        submission.setAnswers(savedAnswers);

        submissionRepository.save(submission);

        StringBuilder body = new StringBuilder();

        body.append("Uczeń przesłał rozwiązanie lekcji\n\n");

        body.append("Uczeń: ")
                .append(user.getEmail())
                .append("\n");

        body.append("Lekcja: ")
                .append(lesson.getTitle())
                .append("\n\n");

        int i = 1;

        for (LessonSubmissionAnswer answer : savedAnswers) {

            body.append("Blok ")
                    .append(i++)
                    .append("\n");

            body.append("Tytuł: ")
                    .append(answer.getTaskContent())
                    .append("\n\n");

            body.append("Odpowiedź ucznia:\n")
                    .append(answer.getInstruction())
                    .append("\n\n");

            body.append("Poprawna odpowiedź:\n")
                    .append(answer.getExpectedAnswer())
                    .append("\n\n");

            body.append("Wynik: ")
                    .append(answer.getCorrect() ? "POPRAWNA" : "BŁĘDNA")
                    .append("\n");

            body.append("--------------------------------------\n\n");
        }

        SimpleMailMessage message =
                new SimpleMailMessage();

        message.setTo("jakub.marcinkowski.p@mojcosinus.pl");

        message.setSubject(
                "Nowe rozwiązanie lekcji - "
                        + lesson.getTitle()
        );

        message.setText(body.toString());

        mailSender.send(message);
    }

    private String normalize(String code) {

        if (code == null) {
            return "";
        }

        return code
                .replaceAll("\\s+", "")
                .replace("'", "\"")
                .toLowerCase();
    }
}